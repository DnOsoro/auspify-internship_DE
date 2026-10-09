
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        year_added,
        content_count,
        movie_count,
        tv_show_count,
        movie_share,
        tv_show_share,
        is_complete_year,
        period_status
      FROM netflix.mart_catalogue_trends
      ORDER BY year_added ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Trends API error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve catalogue trends." },
      { status: 500 },
    );
  }
}