from pathlib import Path

from extract import extract_raw_data
from transform import transform_data


PROJECT_ROOT = Path(__file__).resolve().parents[1]

PROCESSED_DIR = (
    PROJECT_ROOT
    / "data_lake"
    / "processed"
)

OUTPUT_FILE = (
    PROCESSED_DIR
    / "netflix_titles.parquet"
)


def process_data():
    """Extract, transform, and write the processed dataset."""

    print("Extracting raw data...")

    df_raw = extract_raw_data()

    print(
        f"Raw records: {len(df_raw)}"
    )

    print("\nTransforming data...")

    df_clean = transform_data(
        df_raw
    )

    print(
        f"Processed records: {len(df_clean)}"
    )

    PROCESSED_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    print(
        "\nWriting processed Parquet dataset..."
    )

    df_clean.to_parquet(
        OUTPUT_FILE,
        engine="pyarrow",
        index=False
    )

    print(
        f"Processed dataset written to:"
    )

    print(OUTPUT_FILE)

    return df_clean


if __name__ == "__main__":

    process_data()