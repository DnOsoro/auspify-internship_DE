{{ config(materialized='table') }}

select
    forecast_year,
    forecast_content_count,
    model,
    forecast_type,
    status
from {{ ref('stg_forecasts') }}
order by forecast_year
