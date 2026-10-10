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
  try {
    const params = new URL(request.url).searchParams;

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

    if (
      type !== null &&
      type !== "Movie" &&
      type !== "TV Show"
    ) {
      return NextResponse.json(
        { error: "Type must be Movie or TV Show." },
        { status: 400 },
      );
    }

    const values = [year, type, country, genre, rating];

    const [
      kpiResult,
      trendResult,
      countryResult,
      genreResult,
      ratingResult,
    ] = await Promise.all([
      db.query(
        `
          SELECT
            COUNT(*)::integer AS total_titles,
            COUNT(*) FILTER (
              WHERE t.type = 'Movie'
            )::integer AS total_movies,
            COUNT(*) FILTER (
              WHERE t.type = 'TV Show'
            )::integer AS total_tv_shows,
            COALESCE(
              ROUND(
                COUNT(*) FILTER (WHERE t.type = 'Movie')::numeric
                / NULLIF(COUNT(*), 0),
                4
              ),
              0
            ) AS movie_share,
            COALESCE(
              ROUND(
                COUNT(*) FILTER (WHERE t.type = 'TV Show')::numeric
                / NULLIF(COUNT(*), 0),
                4
              ),
              0
            ) AS tv_show_share,
            (
              SELECT percentile_cont(0.5)
                WITHIN GROUP (ORDER BY movie_minutes)
              FROM netflix.netflix_titles t
              WHERE t.type = 'Movie'
                AND t.movie_minutes IS NOT NULL
                AND ($1::integer IS NULL OR t.year_added = $1)
                AND ($2::text IS NULL OR t.type = $2)
                AND (
                  $3::text IS NULL
                  OR COALESCE(
                    t.country_list::text[],
                    ARRAY[]::text[]
                  ) @> ARRAY[$3]::text[]
                )
                AND (
                  $4::text IS NULL
                  OR COALESCE(
                    t.genre_list::text[],
                    ARRAY[]::text[]
                  ) @> ARRAY[$4]::text[]
                )
                AND ($5::text IS NULL OR t.rating = $5)
            ) AS median_movie_runtime
          ${FILTERED_FROM}
        `,
        values,
      ),

      db.query(
        `
          SELECT
            t.year_added,
            COUNT(*)::integer AS content_count,
            COUNT(*) FILTER (
              WHERE t.type = 'Movie'
            )::integer AS movie_count,
            COUNT(*) FILTER (
              WHERE t.type = 'TV Show'
            )::integer AS tv_show_count,
            COALESCE(
              ROUND(
                COUNT(*) FILTER (WHERE t.type = 'Movie')::numeric
                / NULLIF(COUNT(*), 0),
                4
              ),
              0
            ) AS movie_share,
            COALESCE(
              ROUND(
                COUNT(*) FILTER (WHERE t.type = 'TV Show')::numeric
                / NULLIF(COUNT(*), 0),
                4
              ),
              0
            ) AS tv_show_share,
            m.is_complete_year,
            m.period_status
          FROM netflix.netflix_titles t
          LEFT JOIN netflix.mart_catalogue_trends m
            ON m.year_added = t.year_added
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
          GROUP BY
            t.year_added,
            m.is_complete_year,
            m.period_status
          ORDER BY t.year_added
        `,
        values,
      ),

      db.query(
        `
          WITH filtered AS (
            SELECT t.show_id, t.type, t.country_list::text[] AS items
            ${FILTERED_FROM}
          )
          SELECT
            item.value AS name,
            COUNT(DISTINCT f.show_id)::integer AS count
          FROM filtered f
          CROSS JOIN LATERAL unnest(
            COALESCE(f.items, ARRAY[]::text[])
          ) AS item(value)
          GROUP BY item.value
          ORDER BY count DESC, name
          LIMIT 10
        `,
        values,
      ),

      db.query(
        `
          WITH filtered AS (
            SELECT t.show_id, t.type, t.genre_list::text[] AS items
            ${FILTERED_FROM}
          )
          SELECT
            item.value AS name,
            COUNT(DISTINCT f.show_id)::integer AS count
          FROM filtered f
          CROSS JOIN LATERAL unnest(
            COALESCE(f.items, ARRAY[]::text[])
          ) AS item(value)
          GROUP BY item.value
          ORDER BY count DESC, name
          LIMIT 10
        `,
        values,
      ),

      db.query(
        `
          SELECT
            COALESCE(t.rating, 'Unknown') AS name,
            COUNT(*)::integer AS count
          ${FILTERED_FROM}
          GROUP BY COALESCE(t.rating, 'Unknown')
          ORDER BY count DESC, name
          LIMIT 10
        `,
        values,
      ),
    ]);

    return NextResponse.json({
      filters: { year, type, country, genre, rating },
      kpis: kpiResult.rows[0],
      trends: trendResult.rows,
      countries: countryResult.rows,
      genres: genreResult.rows,
      ratings: ratingResult.rows,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("100 characters")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    console.error(
      "Analytics API error:",
      error instanceof Error ? error.name : "Unknown error",
    );

    return NextResponse.json(
      { error: "Unable to retrieve filtered analytics." },
      { status: 500 },
    );
  }
}
