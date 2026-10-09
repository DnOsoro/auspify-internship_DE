{{ config(materialized='table') }}

select
    year_added,
    content_count,
    movie_count,
    tv_show_count,
    movie_share,
    tv_show_share,
    is_complete_year,
    period_status
from {{ ref('stg_yearly_trends') }}
order by year_added