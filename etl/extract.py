import os
from io import BytesIO

import boto3
import pandas as pd


S3_ENDPOINT_URL = os.getenv(
    "S3_ENDPOINT_URL",
    "http://localhost:18333"
)

S3_BUCKET = os.getenv(
    "S3_BUCKET",
    "netflix-data"
)

S3_RAW_KEY = os.getenv(
    "S3_RAW_KEY",
    "raw/netflix_titles.csv"
)

AWS_PROFILE = os.getenv(
    "AWS_PROFILE",
    "seaweedfs"
)


def extract_raw_data():
    """Extract the raw Netflix dataset from SeaweedFS S3."""

    session = boto3.Session(
        profile_name=AWS_PROFILE
    )

    s3 = session.client(
        "s3",
        endpoint_url=S3_ENDPOINT_URL,
        region_name="us-east-1"
    )

    response = s3.get_object(
        Bucket=S3_BUCKET,
        Key=S3_RAW_KEY
    )

    data = response["Body"].read()

    df = pd.read_csv(
        BytesIO(data)
    )

    return df


if __name__ == "__main__":

    df = extract_raw_data()

    print("Successfully extracted raw Netflix data.")
    print("Shape:", df.shape)

    print("\nColumns:")
    for column in df.columns:
        print(f"- {column}")