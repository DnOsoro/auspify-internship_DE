{{ config(materialized='view') }}

select
    year_added,
    content_count,
    movie_count,
    tv_show_count,
    movie_share,
    tv_show_share,
    is_complete_year,
    period_status
from {{ source('netflix', 'yearly_trends') }}