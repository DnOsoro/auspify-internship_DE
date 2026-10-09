from extract import extract_raw_data


REQUIRED_COLUMNS = [
    "show_id",
    "type",
    "title",
    "director",
    "country",
    "date_added",
    "release_year",
    "rating",
    "duration",
    "listed_in",
]


EXPECTED_TYPES = {
    "Movie",
    "TV Show",
}


def validate_schema(df):
    """Validate the basic structure of the raw Netflix dataset."""

    missing_columns = [
        column
        for column in REQUIRED_COLUMNS
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    extra_columns = [
        column
        for column in df.columns
        if column not in REQUIRED_COLUMNS
    ]

    if extra_columns:
        print(
            f"Warning: unexpected columns found: {extra_columns}"
        )

    return True


def validate_required_fields(df):
    """Validate fields that should never be missing."""

    missing_show_ids = df["show_id"].isna().sum()
    missing_titles = df["title"].isna().sum()

    if missing_show_ids > 0:
        raise ValueError(
            f"Found {missing_show_ids} missing show_id values."
        )

    if missing_titles > 0:
        raise ValueError(
            f"Found {missing_titles} missing title values."
        )

    return True


def validate_content_types(df):
    """Validate the allowed values in the type column."""

    invalid_types = set(df["type"].dropna().unique()) - EXPECTED_TYPES

    if invalid_types:
        raise ValueError(
            f"Unexpected content types found: {invalid_types}"
        )

    return True


def validate_data(df):
    """Run all raw-data validation checks."""

    validate_schema(df)
    validate_required_fields(df)
    validate_content_types(df)

    return True


if __name__ == "__main__":
    print("Extracting raw data...")

    df = extract_raw_data()

    print(f"Extracted {len(df)} rows.")

    print("\nRunning validation...")

    validate_data(df)

    print("Validation passed.")