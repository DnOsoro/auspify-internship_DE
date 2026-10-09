import numpy as np
import pandas as pd


def split_clean(value):
    """Split comma-separated values and remove empty items."""

    if pd.isna(value):
        return []

    return [
        item.strip()
        for item in value.split(",")
        if item.strip()
    ]


def transform_data(df):
    """
    Transform the raw Netflix dataset using the validated
    Task 1 cleaning and feature-engineering logic.
    """

    df = df.copy()

    # ---------------------------------------------------------
    # 1. Remove accidental index columns
    # ---------------------------------------------------------

    df = df.loc[
        :,
        ~df.columns.str.startswith("Unnamed")
    ].copy()

    # ---------------------------------------------------------
    # 2. Remove completely empty columns
    # ---------------------------------------------------------

    empty_columns = df.columns[
        df.isna().all()
    ].tolist()

    if empty_columns:
        df = df.drop(columns=empty_columns)

    # ---------------------------------------------------------
    # 3. Clean whitespace from text columns
    # ---------------------------------------------------------

    text_cols = df.select_dtypes(
        include="object"
    ).columns

    df[text_cols] = df[text_cols].apply(
        lambda c: c.str.strip()
    )

    # ---------------------------------------------------------
    # 4. Standardize placeholder values
    # ---------------------------------------------------------

    placeholders = [
        "Not Given",
        "N/A",
        "NA",
        "",
        "Unknown"
    ]

    missing_value_cols = [
        "director",
        "country",
        "rating",
        "date_added",
        "duration"
    ]

    for col in missing_value_cols:
        df[col] = df[col].replace(
            placeholders,
            np.nan
        )

    # ---------------------------------------------------------
    # 5. Repair misplaced durations in rating
    # ---------------------------------------------------------

    misplaced_duration_mask = (
        df["rating"]
        .astype("string")
        .str.contains(
            r"\bmin\b",
            case=False,
            na=False
        )
    )

    if misplaced_duration_mask.any():

        df.loc[
            misplaced_duration_mask,
            "duration"
        ] = df.loc[
            misplaced_duration_mask,
            "rating"
        ]

        df.loc[
            misplaced_duration_mask,
            "rating"
        ] = np.nan

    # ---------------------------------------------------------
    # 6. Remove duplicate content records
    # ---------------------------------------------------------

    content_cols = df.columns.drop(
        "show_id"
    )

    df = df.drop_duplicates(
        subset=content_cols,
        keep="first"
    ).copy()

    # ---------------------------------------------------------
    # 7. Standardize ratings
    # ---------------------------------------------------------

    df["rating"] = (
        df["rating"]
        .replace({
            "NR": "Not Rated",
            "UR": "Not Rated"
        })
        .fillna("Not Rated")
    )

    # ---------------------------------------------------------
    # 8. Fill unknown director and country values
    # ---------------------------------------------------------

    df["director"] = df["director"].fillna(
        "Unknown"
    )

    df["country"] = df["country"].fillna(
        "Unknown"
    )

    # ---------------------------------------------------------
    # 9. Parse date_added
    # ---------------------------------------------------------

    df["date_added"] = pd.to_datetime(
        df["date_added"],
        format="%m/%d/%Y",
        errors="coerce"
    )

    if df["date_added"].isna().any():
        raise ValueError(
            "Some date_added values failed to parse."
        )

    df["year_added"] = (
        df["date_added"].dt.year
    )

    df["month_added"] = (
        df["date_added"].dt.month
    )

    df["month_name"] = (
        df["date_added"].dt.month_name()
    )

    months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ]

    df["month_name"] = pd.Categorical(
        df["month_name"],
        categories=months,
        ordered=True
    )

    # ---------------------------------------------------------
    # 10. Parse duration
    # ---------------------------------------------------------

    df["duration_value"] = (
        df["duration"]
        .str.extract(
            r"(\d+)",
            expand=False
        )
        .astype(float)
    )

    df["duration_unit"] = (
        df["duration"]
        .str.extract(
            r"([A-Za-z]+)",
            expand=False
        )
        .str.lower()
        .replace({
            "season": "seasons"
        })
    )

    df["movie_minutes"] = np.where(
        df["type"] == "Movie",
        df["duration_value"],
        np.nan
    )

    df["tv_seasons"] = np.where(
        df["type"] == "TV Show",
        df["duration_value"],
        np.nan
    )

    # ---------------------------------------------------------
    # 11. Create list-based features
    # ---------------------------------------------------------

    df["country_list"] = df["country"].apply(
        lambda value: (
            []
            if value == "Unknown"
            else split_clean(value)
        )
    )

    df["genre_list"] = df["listed_in"].apply(
        split_clean
    )

    df["director_list"] = df["director"].apply(
        lambda value: (
            []
            if value == "Unknown"
            else split_clean(value)
        )
    )

    df["n_countries"] = (
        df["country_list"].str.len()
    )

    df["n_genres"] = (
        df["genre_list"].str.len()
    )

    df["n_directors"] = (
        df["director_list"].str.len()
    )

    # ---------------------------------------------------------
    # 12. Create audience groups
    # ---------------------------------------------------------

    kids = [
        "TV-Y",
        "TV-Y7",
        "TV-Y7-FV",
        "TV-G",
        "G",
        "TV-PG",
        "PG"
    ]

    teens = [
        "PG-13",
        "TV-14"
    ]

    adults = [
        "R",
        "TV-MA",
        "NC-17"
    ]

    df["audience"] = np.select(
        [
            df["rating"].isin(kids),
            df["rating"].isin(teens),
            df["rating"].isin(adults)
        ],
        [
            "Kids",
            "Teens",
            "Adults"
        ],
        default="Not Rated"
    )

    # ---------------------------------------------------------
    # 13. Create release/addition timing features
    # ---------------------------------------------------------

    df["years_to_add"] = (
        df["year_added"]
        - df["release_year"]
    )

    df["added_before_release"] = (
        df["years_to_add"] < 0
    )

    # ---------------------------------------------------------
    # 14. Convert repeated categorical fields
    # ---------------------------------------------------------

    for col in [
        "type",
        "rating",
        "audience"
    ]:
        df[col] = df[col].astype(
            "category"
        )

    return df


if __name__ == "__main__":

    print(
        "transform.py loaded successfully."
    )