{{ config(materialized='table') }}

select
    model,
    accuracy,
    precision,
    recall,
    f1_score,
    selected
from {{ ref('stg_model_results') }}
order by selected desc, accuracy desc
