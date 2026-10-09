from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]

PROCESSED_FILE = (
    PROJECT_ROOT
    / "data_lake"
    / "processed"
    / "netflix_titles.parquet"
)

CURATED_DIR = (
    PROJECT_ROOT
    / "data_lake"
    / "curated"
)

OUTPUT_FILE = (
    CURATED_DIR
    / "yearly_trends.parquet"
)


def create_yearly_trends():
    """Create yearly Netflix catalogue addition metrics."""

    print("Loading processed dataset...")

    df = pd.read_parquet(
        PROCESSED_FILE
    )

    print(
        "Processed shape:",
        df.shape
    )

    print("\nCreating yearly catalogue trends...")

    yearly_trends = (
        df[
            df["year_added"].notna()
        ]
        .groupby(
            "year_added",
            as_index=False
        )
        .agg(
            content_count=(
                "show_id",
                "count"
            ),
            movie_count=(
                "type",
                lambda values: (
                    values == "Movie"
                ).sum()
            ),
            tv_show_count=(
                "type",
                lambda values: (
                    values == "TV Show"
                ).sum()
            )
        )
        .sort_values(
            "year_added"
        )
        .reset_index(
            drop=True
        )
    )

    yearly_trends["movie_share"] = (
        yearly_trends["movie_count"]
        / yearly_trends["content_count"]
    )

    yearly_trends["tv_show_share"] = (
        yearly_trends["tv_show_count"]
        / yearly_trends["content_count"]
    )

    yearly_trends["is_complete_year"] = (
        yearly_trends["year_added"] < 2021
    )

    yearly_trends["period_status"] = (
        yearly_trends["year_added"]
        .apply(
            lambda year: (
                "Complete"
                if year < 2021
                else "Incomplete"
            )
        )
    )

    CURATED_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    yearly_trends.to_parquet(
        OUTPUT_FILE,
        engine="pyarrow",
        index=False
    )

    print(
        "\nCurated dataset created:"
    )

    print(OUTPUT_FILE)

    print(
        "\nShape:",
        yearly_trends.shape
    )

    print(
        "\nYearly trends:"
    )

    print(
        yearly_trends.to_string(
            index=False
        )
    )

    return yearly_trends


def create_country_metrics(df):
    """Create country-level catalogue metrics."""

    print("\nCreating country metrics...")

    country_rows = []

    for _, row in df.iterrows():

        for country in row["country_list"]:

            country_rows.append(
                {
                    "country": country,
                    "show_id": row["show_id"],
                    "type": row["type"],
                }
            )

    country_df = pd.DataFrame(
        country_rows
    )

    country_metrics = (
        country_df
        .groupby(
            "country",
            as_index=False
        )
        .agg(
            content_count=(
                "show_id",
                "nunique"
            ),
            movie_count=(
                "type",
                lambda values: (
                    values == "Movie"
                ).sum()
            ),
            tv_show_count=(
                "type",
                lambda values: (
                    values == "TV Show"
                ).sum()
            )
        )
        .sort_values(
            "content_count",
            ascending=False
        )
        .reset_index(
            drop=True
        )
    )

    total_country_assignments = (
        country_metrics["content_count"]
        .sum()
    )

    country_metrics[
        "share_of_country_assignments"
    ] = (
        country_metrics["content_count"]
        / total_country_assignments
    )

    output_file = (
        CURATED_DIR
        / "country_metrics.parquet"
    )

    country_metrics.to_parquet(
        output_file,
        engine="pyarrow",
        index=False
    )

    print(
        "Country metrics created:"
    )

    print(output_file)

    print(
        "\nShape:",
        country_metrics.shape
    )

    print(
        "\nTop 10 countries:"
    )

    print(
        country_metrics.head(10).to_string(
            index=False
        )
    )

    return country_metrics


def create_genre_metrics(df):
    """Create genre-level catalogue metrics."""

    print("\nCreating genre metrics...")

    genre_rows = []

    for _, row in df.iterrows():

        for genre in row["genre_list"]:

            genre_rows.append(
                {
                    "genre": genre,
                    "show_id": row["show_id"],
                    "type": row["type"],
                }
            )

    genre_df = pd.DataFrame(
        genre_rows
    )

    genre_metrics = (
        genre_df
        .groupby(
            "genre",
            as_index=False
        )
        .agg(
            content_count=(
                "show_id",
                "nunique"
            ),
            movie_count=(
                "type",
                lambda values: (
                    values == "Movie"
                ).sum()
            ),
            tv_show_count=(
                "type",
                lambda values: (
                    values == "TV Show"
                ).sum()
            )
        )
        .sort_values(
            "content_count",
            ascending=False
        )
        .reset_index(
            drop=True
        )
    )

    total_genre_assignments = (
        genre_metrics["content_count"]
        .sum()
    )

    genre_metrics[
        "share_of_genre_assignments"
    ] = (
        genre_metrics["content_count"]
        / total_genre_assignments
    )

    output_file = (
        CURATED_DIR
        / "genre_metrics.parquet"
    )

    genre_metrics.to_parquet(
        output_file,
        engine="pyarrow",
        index=False
    )

    print(
        "Genre metrics created:"
    )

    print(output_file)

    print(
        "\nShape:",
        genre_metrics.shape
    )

    print(
        "\nTop 10 genres:"
    )

    print(
        genre_metrics.head(10).to_string(
            index=False
        )
    )

    return genre_metrics


def create_rating_metrics(df):
    """Create rating-level catalogue metrics."""

    print("\nCreating rating metrics...")

    rating_metrics = (
        df
        .groupby(
            "rating",
            observed=True,
            as_index=False
        )
        .agg(
            content_count=(
                "show_id",
                "nunique"
            ),
            movie_count=(
                "type",
                lambda values: (
                    values == "Movie"
                ).sum()
            ),
            tv_show_count=(
                "type",
                lambda values: (
                    values == "TV Show"
                ).sum()
            )
        )
        .sort_values(
            "content_count",
            ascending=False
        )
        .reset_index(
            drop=True
        )
    )

    total_content = (
        rating_metrics["content_count"]
        .sum()
    )

    rating_metrics[
        "share_of_catalogue"
    ] = (
        rating_metrics["content_count"]
        / total_content
    )

    output_file = (
        CURATED_DIR
        / "rating_metrics.parquet"
    )

    rating_metrics.to_parquet(
        output_file,
        engine="pyarrow",
        index=False
    )

    print(
        "Rating metrics created:"
    )

    print(output_file)

    print(
        "\nShape:",
        rating_metrics.shape
    )

    print(
        "\nRating metrics:"
    )

    print(
        rating_metrics.to_string(
            index=False
        )
    )

    return rating_metrics


def create_forecasts():
    """Create the validated Task 4 baseline forecast dataset."""

    print("\nCreating forecast metrics...")

    forecast_years = [
        2021,
        2022,
        2023,
        2024,
        2025
    ]

    forecast_values = [
        953,
        953,
        953,
        953,
        953
    ]

    forecasts = pd.DataFrame(
        {
            "forecast_year": forecast_years,
            "forecast_content_count": forecast_values,
            "model": "Naive Baseline",
            "forecast_type": "Catalogue Trend Baseline",
            "status": "Forecast"
        }
    )

    output_file = (
        CURATED_DIR
        / "forecasts.parquet"
    )

    forecasts.to_parquet(
        output_file,
        engine="pyarrow",
        index=False
    )

    print(
        "Forecast dataset created:"
    )

    print(output_file)

    print(
        "\nShape:",
        forecasts.shape
    )

    print(
        "\nForecasts:"
    )

    print(
        forecasts.to_string(
            index=False
        )
    )

    return forecasts


def create_model_results():
    """Create the validated Task 5 model evaluation results."""

    print("\nCreating model results...")

    model_results = pd.DataFrame(
        [
            {
                "model": "Random Forest",
                "accuracy": 0.9767,
                "precision": 0.9767,
                "recall": 0.9456,
                "f1_score": 0.9609,
                "selected": True,
            },
            {
                "model": "Logistic Regression",
                "accuracy": 0.9761,
                "precision": 0.9730,
                "recall": 0.9475,
                "f1_score": 0.9601,
                "selected": False,
            },
        ]
    )

    output_file = (
        CURATED_DIR
        / "model_results.parquet"
    )

    model_results.to_parquet(
        output_file,
        engine="pyarrow",
        index=False
    )

    print(
        "Model results created:"
    )

    print(output_file)

    print(
        "\nShape:",
        model_results.shape
    )

    print(
        "\nModel results:"
    )

    print(
        model_results.to_string(
            index=False
        )
    )

    return model_results


def create_data_quality(df):
    """Create the validated data quality metrics."""

    print("\nCreating data quality metrics...")

    duplicate_show_ids = df["show_id"].duplicated().sum()

    content_columns = [
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
    duplicate_content = df.duplicated(
        subset=content_columns
    ).sum()

    missing_titles = df["title"].isna().sum()

    unknown_directors = (df["director"] == "Unknown").sum()

    unknown_countries = (df["country"] == "Unknown").sum()

    not_rated = (df["rating"] == "Not Rated").sum()

    added_before_release = df["added_before_release"].sum()

    short_movies = (
        (df["type"] == "Movie")
        & (df["movie_minutes"] < 40)
    ).sum()

    data_quality = pd.DataFrame(
        [
            {
                "metric": "total_records",
                "value": len(df),
                "status": "Passed",
            },
            {
                "metric": "duplicate_show_ids",
                "value": duplicate_show_ids,
                "status": "Passed" if duplicate_show_ids == 0 else "Warning",
            },
            {
                "metric": "duplicate_content",
                "value": duplicate_content,
                "status": "Passed" if duplicate_content == 0 else "Warning",
            },
            {
                "metric": "missing_titles",
                "value": missing_titles,
                "status": "Passed" if missing_titles == 0 else "Warning",
            },
            {
                "metric": "unknown_directors",
                "value": unknown_directors,
                "status": "Information",
            },
            {
                "metric": "unknown_countries",
                "value": unknown_countries,
                "status": "Information",
            },
            {
                "metric": "not_rated",
                "value": not_rated,
                "status": "Information",
            },
            {
                "metric": "added_before_release",
                "value": added_before_release,
                "status": "Warning" if added_before_release > 0 else "Passed",
            },
            {
                "metric": "movies_under_40_minutes",
                "value": short_movies,
                "status": "Information",
            },
        ]
    )

    output_file = CURATED_DIR / "data_quality.parquet"

    data_quality.to_parquet(
        output_file,
        engine="pyarrow",
        index=False
    )

    print("Data quality dataset created:")
    print(output_file)

    print("\nShape:", data_quality.shape)

    print("\nData quality metrics:")
    print(data_quality.to_string(index=False))

    return data_quality


if __name__ == "__main__":

    create_yearly_trends()

    print(
        "\nLoading processed dataset for country metrics..."
    )

    processed_df = pd.read_parquet(
        PROCESSED_FILE
    )

    create_country_metrics(
        processed_df
    )

    create_genre_metrics(
        processed_df
    )

    create_rating_metrics(
        processed_df
    )

    create_forecasts()

    create_model_results()

    create_data_quality(
        processed_df
    )