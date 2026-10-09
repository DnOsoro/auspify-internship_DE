{{ config(materialized='view') }}

select
    model,
    accuracy,
    precision,
    recall,
    f1_score,
    selected
from {{ source('netflix', 'model_results') }}