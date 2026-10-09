{{ config(materialized='table') }}

select
    rating,
    content_count,
    movie_count,
    tv_show_count,
    share_of_catalogue
from {{ ref('stg_rating_metrics') }}
order by content_count desc
