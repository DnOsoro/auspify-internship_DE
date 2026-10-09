
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        rating,
        content_count,
        movie_count,
        tv_show_count,
        share_of_catalogue
      FROM netflix.mart_rating_metrics
      ORDER BY content_count DESC
      LIMIT 5
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Ratings API error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve rating metrics." },
      { status: 500 },
    );
  }
}