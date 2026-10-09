{{ config(materialized='table') }}

select
    genre,
    content_count,
    movie_count,
    tv_show_count,
    share_of_genre_assignments
from {{ ref('stg_genre_metrics') }}
order by content_count desc