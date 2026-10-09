{{ config(materialized='table') }}

select
    country,
    content_count,
    movie_count,
    tv_show_count,
    share_of_country_assignments
from {{ ref('stg_country_metrics') }}
order by content_count desc