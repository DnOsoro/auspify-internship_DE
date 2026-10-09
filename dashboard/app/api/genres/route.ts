
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        genre,
        content_count,
        movie_count,
        tv_show_count,
        share_of_genre_assignments
      FROM netflix.mart_genre_metrics
      ORDER BY content_count DESC
      LIMIT 5
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Genres API error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve genre metrics." },
      { status: 500 },
    );
  }
}