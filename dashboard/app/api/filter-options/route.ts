import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [years, types, countries, genres, ratings] = await Promise.all([
      db.query(`
        SELECT DISTINCT year_added AS value
        FROM netflix.netflix_titles
        WHERE year_added IS NOT NULL
        ORDER BY value DESC
      `),

      db.query(`
        SELECT DISTINCT type AS value
        FROM netflix.netflix_titles
        WHERE type IS NOT NULL AND btrim(type) <> ''
        ORDER BY value
      `),

      db.query(`
        SELECT DISTINCT item AS value
        FROM netflix.netflix_titles t
        CROSS JOIN LATERAL
          unnest(COALESCE(t.country_list::text[], ARRAY[]::text[])) AS item
        WHERE btrim(item) <> ''
        ORDER BY value
      `),

      db.query(`
        SELECT DISTINCT item AS value
        FROM netflix.netflix_titles t
        CROSS JOIN LATERAL
          unnest(COALESCE(t.genre_list::text[], ARRAY[]::text[])) AS item
        WHERE btrim(item) <> ''
        ORDER BY value
      `),

      db.query(`
        SELECT DISTINCT rating AS value
        FROM netflix.netflix_titles
        WHERE rating IS NOT NULL AND btrim(rating) <> ''
        ORDER BY value
      `),
    ]);

    return NextResponse.json({
      years: years.rows.map((row) => row.value),
      types: types.rows.map((row) => row.value),
      countries: countries.rows.map((row) => row.value),
      genres: genres.rows.map((row) => row.value),
      ratings: ratings.rows.map((row) => row.value),
    });
  } catch (error) {
    console.error("Filter options error:", error);

    return NextResponse.json(
      { error: "Could not load filter options from the database." },
      { status: 500 },
    );
  }
}
