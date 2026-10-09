{{ config(materialized='table') }}

select
    metric,
    value,
    status
from {{ ref('stg_data_quality') }}
order by
    case status
        when 'Warning' then 1
        when 'Information' then 2
        when 'Passed' then 3
        else 4
    end,
    metric