import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from etl.load import DATABASE_URL

source_file = "data_lake/processed/netflix_titles.parquet"

df = pd.read_parquet(source_file)

list_columns = [
    "country_list",
    "genre_list",
    "director_list",
]

for column in list_columns:
    df[column] = df[column].apply(
        lambda value: (
            value.tolist()
            if hasattr(value, "tolist")
            else value
        )
    )

engine = create_engine(DATABASE_URL)

try:
    print(f"Source rows: {len(df)}")

    with engine.begin() as connection:
        connection.execute(
            text("TRUNCATE TABLE netflix.netflix_titles")
        )

        df.to_sql(
            "netflix_titles",
            connection,
            schema="netflix",
            if_exists="append",
            index=False,
            method="multi",
            chunksize=500,
        )

        count = connection.execute(
            text("SELECT COUNT(*) FROM netflix.netflix_titles")
        ).scalar()

        print(f"Database rows: {count}")

finally:
    engine.dispose()