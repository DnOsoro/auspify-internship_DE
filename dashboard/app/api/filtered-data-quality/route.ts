import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const FILTERED_FROM = `
  FROM netflix.netflix_titles t
  WHERE ($1::integer IS NULL OR t.year_added = $1)
    AND ($2::text IS NULL OR t.type = $2)
    AND (
      $3::text IS NULL
      OR COALESCE(t.country_list::text[], ARRAY[]::text[])
         @> ARRAY[$3]::text[]
    )
    AND (
      $4::text IS NULL
      OR COALESCE(t.genre_list::text[], ARRAY[]::text[])
         @> ARRAY[$4]::text[]
    )
    AND ($5::text IS NULL OR t.rating = $5)
`;

function readOptionalText(
  value: string | null,
  label: string,
): string | null {
  if (value === null || value.trim() === "") {
    return null;
  }

  const cleaned = value.trim();

  if (cleaned.length > 100) {
    throw new Error(`${label} must be 100 characters or fewer.`);
  }

  return cleaned;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {

    const yearText = params.get("year");
    let year: number | null = null;

    if (yearText !== null && yearText.trim() !== "") {
      if (!/^\d{4}$/.test(yearText.trim())) {
        return NextResponse.json(
          { error: "Year must be a four-digit number." },
          { status: 400 },
        );
      }

      year = Number(yearText);

      if (year < 1900 || year > 2100) {
        return NextResponse.json(
          { error: "Year must be between 1900 and 2100." },
          { status: 400 },
        );
      }
    }

    const type = readOptionalText(params.get("type"), "Content type");
    const country = readOptionalText(params.get("country"), "Country");
    const genre = readOptionalText(params.get("genre"), "Genre");
    const rating = readOptionalText(params.get("rating"), "Rating");

    if (type !== null && type !== "Movie" && type !== "TV Show") {
      return NextResponse.json(
        { error: "Type must be Movie or TV Show." },
        { status: 400 },
      );
    }

    const values = [year, type, country, genre, rating];

    const result = await db.query(
      `
        WITH filtered AS (
          SELECT t.*
          ${FILTERED_FROM}
        ),
        ranked AS (
          SELECT
            f.*,
            ROW_NUMBER() OVER (
              PARTITION BY f.show_id
              ORDER BY f.show_id
            ) AS show_id_row,
            ROW_NUMBER() OVER (
              PARTITION BY
                f.type,
                f.title,
                f.director,
                f.country,
                f.date_added,
                f.release_year,
                f.rating,
                f.duration,
                f.listed_in
              ORDER BY f.show_id NULLS LAST
            ) AS content_row
          FROM filtered f
        )
        SELECT
          COUNT(*)::integer AS total_records,
          COUNT(*) FILTER (
            WHERE show_id_row > 1
          )::integer AS duplicate_show_ids,
          COUNT(*) FILTER (
            WHERE content_row > 1
          )::integer AS duplicate_content,
          COUNT(*) FILTER (
            WHERE title IS NULL
          )::integer AS missing_titles,
          COUNT(*) FILTER (
            WHERE director = 'Unknown'
          )::integer AS unknown_directors,
          COUNT(*) FILTER (
            WHERE country = 'Unknown'
          )::integer AS unknown_countries,
          COUNT(*) FILTER (
            WHERE rating = 'Not Rated'
          )::integer AS not_rated,
          COUNT(*) FILTER (
            WHERE added_before_release IS TRUE
          )::integer AS added_before_release,
          COUNT(*) FILTER (
            WHERE type = 'Movie'
              AND movie_minutes < 40
          )::integer AS movies_under_40_minutes
        FROM ranked
      `,
      values,
    );

    const counts = result.rows[0];

    const metrics = [
      {
        metric: "total_records",
        value: counts.total_records,
        status: "Passed",
      },
      {
        metric: "duplicate_show_ids",
        value: counts.duplicate_show_ids,
        status: Number(counts.duplicate_show_ids) === 0
          ? "Passed"
          : "Warning",
      },
      {
        metric: "duplicate_content",
        value: counts.duplicate_content,
        status: Number(counts.duplicate_content) === 0
          ? "Passed"
          : "Warning",
      },
      {
        metric: "missing_titles",
        value: counts.missing_titles,
        status: Number(counts.missing_titles) === 0
          ? "Passed"
          : "Warning",
      },
      {
        metric: "unknown_directors",
        value: counts.unknown_directors,
        status: "Information",
      },
      {
        metric: "unknown_countries",
        value: counts.unknown_countries,
        status: "Information",
      },
      {
        metric: "not_rated",
        value: counts.not_rated,
        status: "Information",
      },
      {
        metric: "added_before_release",
        value: counts.added_before_release,
        status: Number(counts.added_before_release) > 0
          ? "Warning"
          : "Passed",
      },
      {
        metric: "movies_under_40_minutes",
        value: counts.movies_under_40_minutes,
        status: "Information",
      },
    ];

    return NextResponse.json({
      filters: { year, type, country, genre, rating },
      metrics,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("100 characters")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    console.error("Filtered data quality API error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve filtered data quality metrics." },
      { status: 500 },
    );
  }
}
