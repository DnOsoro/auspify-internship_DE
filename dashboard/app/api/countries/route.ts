
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        country,
        content_count,
        movie_count,
        tv_show_count,
        share_of_country_assignments
      FROM netflix.mart_country_metrics
      ORDER BY content_count DESC
      LIMIT 5
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Countries API error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve country metrics." },
      { status: 500 },
    );
  }
}