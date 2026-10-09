import os
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CURATED_DIR = PROJECT_ROOT / "data_lake" / "curated"


load_dotenv(PROJECT_ROOT / ".env")


PGHOST = os.getenv("PGHOST", "localhost")
PGPORT = os.getenv("PGPORT", "5432")
PGDATABASE = os.getenv("PGDATABASE", "netflix")
PGUSER = os.getenv("PGUSER", "netflix_app")
PGPASSWORD = os.getenv("PGPASSWORD")


if not PGPASSWORD:
    raise ValueError("PGPASSWORD is not set in .env")


DATABASE_URL = (
    f"postgresql+psycopg://{PGUSER}:{PGPASSWORD}"
    f"@{PGHOST}:{PGPORT}/{PGDATABASE}"
)


def create_database_engine():
    """Create a SQLAlchemy connection to PostgreSQL."""

    return create_engine(DATABASE_URL)


def create_schema(engine):
    """Create the project schema if it does not already exist."""

    with engine.begin() as connection:
        connection.execute(
            text("CREATE SCHEMA IF NOT EXISTS netflix")
        )

    print("Schema 'netflix' is ready.")


def load_parquet_to_postgres(
    engine,
    filename,
    table_name,
):
    """Load a curated Parquet dataset into PostgreSQL."""

    file_path = CURATED_DIR / filename

    print(f"\nLoading {filename}...")
    print(f"Source: {file_path}")

    df = pd.read_parquet(file_path)

    print(f"Rows: {len(df)}")
    print(f"Columns: {len(df.columns)}")

    df.to_sql(
        table_name,
        engine,
        schema="netflix",
        if_exists="replace",
        index=False,
        method="multi",
    )

    print(f"Loaded into netflix.{table_name}")

    return df


def verify_table(engine, table_name):
    """Verify the number of rows loaded into PostgreSQL."""

    query = text(
        f'SELECT COUNT(*) FROM netflix."{table_name}"'
    )

    with engine.connect() as connection:
        count = connection.execute(query).scalar()

    print(
        f"Verified netflix.{table_name}: "
        f"{count:,} rows"
    )

    return count


def main():
    print("Connecting to PostgreSQL...")

    engine = create_database_engine()

    with engine.connect() as connection:
        result = connection.execute(
            text(
                "SELECT current_database(), "
                "current_user, version()"
            )
        ).fetchone()

    print("PostgreSQL connection successful.")
    print(f"Database: {result[0]}")
    print(f"User: {result[1]}")
    print(f"Version: {result[2].split(',')[0]}")

    create_schema(engine)

    processed_file = (
        PROJECT_ROOT
        / "data_lake"
        / "processed"
        / "netflix_titles.parquet"
    )

    print("\nLoading processed Netflix title records...")

    titles_df = pd.read_parquet(processed_file)

    print(f"Title records: {len(titles_df):,}")

    titles_df.to_sql(
        "netflix_titles",
        engine,
        schema="netflix",
        if_exists="replace",
        index=False,
        method="multi",
        chunksize=500,
    )

    verify_table(engine, "netflix_titles")

    datasets = [
        ("yearly_trends.parquet", "yearly_trends"),
        ("country_metrics.parquet", "country_metrics"),
        ("genre_metrics.parquet", "genre_metrics"),
        ("rating_metrics.parquet", "rating_metrics"),
        ("forecasts.parquet", "forecasts"),
        ("model_results.parquet", "model_results"),
        ("data_quality.parquet", "data_quality"),
    ]

    for filename, table_name in datasets:
        load_parquet_to_postgres(
            engine,
            filename,
            table_name,
        )
        verify_table(engine, table_name)

    print("\nAll curated datasets loaded successfully.")


if __name__ == "__main__":
    main()