import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        total_titles_added,
        total_movies_added,
        total_tv_shows_added,
        movie_share,
        tv_show_share,
        peak_year,
        peak_year_additions,
        median_movie_runtime
      FROM netflix.mart_dashboard_kpis
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No dashboard KPI data was found." },
        { status: 404 },
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("KPI API error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve dashboard KPIs." },
      { status: 500 },
    );
  }
}