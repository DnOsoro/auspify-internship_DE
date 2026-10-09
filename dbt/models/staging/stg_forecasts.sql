{{ config(materialized='view') }}

select
    forecast_year,
    forecast_content_count,
    model,
    forecast_type,
    status
from {{ source('netflix', 'forecasts') }}