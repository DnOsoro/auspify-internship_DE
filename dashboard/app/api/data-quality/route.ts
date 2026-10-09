
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        metric,
        value,
        status
      FROM netflix.mart_data_quality
      ORDER BY
        CASE status
          WHEN 'Warning' THEN 1
          WHEN 'Information' THEN 2
          WHEN 'Passed' THEN 3
          ELSE 4
        END,
        metric ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Data quality API error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve data quality metrics." },
      { status: 500 },
    );
  }
}