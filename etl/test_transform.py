import pandas as pd

from extract import extract_raw_data
from transform import transform_data


REFERENCE_FILE = "data/netflix_clean.csv"


print("Loading reference Task 1 dataset...")

reference_df = pd.read_csv(
    REFERENCE_FILE
)

print(
    "Reference shape:",
    reference_df.shape
)


print("\nExtracting raw data from SeaweedFS...")

raw_df = extract_raw_data()

print(
    "Raw shape:",
    raw_df.shape
)


print("\nRunning ETL transformation...")

etl_df = transform_data(
    raw_df
)

print(
    "ETL shape:",
    etl_df.shape
)


print("\nComparing columns...")

reference_columns = list(
    reference_df.columns
)

etl_columns = list(
    etl_df.columns
)

print(
    "Reference columns:",
    len(reference_columns)
)

print(
    "ETL columns:",
    len(etl_columns)
)

assert reference_columns == etl_columns, (
    "Column order does not match."
)

print("Column comparison: PASSED")


print("\nComparing row counts...")

assert len(reference_df) == len(etl_df), (
    "Row counts do not match."
)

print("Row count comparison: PASSED")


print("\nComparing show_id values...")

assert (
    reference_df["show_id"].tolist()
    == etl_df["show_id"].tolist()
), "show_id values do not match."

print("show_id comparison: PASSED")


print("\nComparing scalar columns...")

scalar_columns = [
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
    "year_added",
    "month_added",
    "month_name",
    "duration_value",
    "duration_unit",
    "movie_minutes",
    "tv_seasons",
    "n_countries",
    "n_genres",
    "n_directors",
    "audience",
    "years_to_add",
    "added_before_release",
]


reference_compare = reference_df[
    scalar_columns
].copy()

etl_compare = etl_df[
    scalar_columns
].copy()


reference_compare["date_added"] = pd.to_datetime(
    reference_compare["date_added"]
)

etl_compare["date_added"] = pd.to_datetime(
    etl_compare["date_added"]
)


reference_compare["month_name"] = (
    reference_compare["month_name"]
    .astype("string")
)

etl_compare["month_name"] = (
    etl_compare["month_name"]
    .astype("string")
)


reference_compare["type"] = (
    reference_compare["type"]
    .astype("string")
)

etl_compare["type"] = (
    etl_compare["type"]
    .astype("string")
)


reference_compare["rating"] = (
    reference_compare["rating"]
    .astype("string")
)

etl_compare["rating"] = (
    etl_compare["rating"]
    .astype("string")
)


reference_compare["audience"] = (
    reference_compare["audience"]
    .astype("string")
)

etl_compare["audience"] = (
    etl_compare["audience"]
    .astype("string")
)


pd.testing.assert_frame_equal(
    reference_compare.reset_index(drop=True),
    etl_compare.reset_index(drop=True),
    check_dtype=False
)

print("Scalar data comparison: PASSED")


print("\nComparing list columns...")

list_columns = [
    "country_list",
    "genre_list",
    "director_list",
]


for column in list_columns:

    reference_lists = (
        reference_df[column]
        .apply(eval)
        if reference_df[column].dtype == "object"
        and len(reference_df[column]) > 0
        and isinstance(
            reference_df[column].iloc[0],
            str
        )
        else reference_df[column]
    )

    etl_lists = etl_df[column]

    for index, (reference_value, etl_value) in enumerate(
        zip(reference_lists, etl_lists)
    ):

        if list(reference_value) != list(etl_value):

            raise AssertionError(
                f"List comparison failed for "
                f"{column} at row {index}."
            )


print("List data comparison: PASSED")


print("\n" + "=" * 60)
print("ETL REPRODUCTION TEST PASSED")
print("=" * 60)
print(
    "The production ETL reproduces the Task 1 cleaned dataset."
)