{{ config(materialized='view') }}

select
    metric,
    value,
    status
from {{ source('netflix', 'data_quality') }}