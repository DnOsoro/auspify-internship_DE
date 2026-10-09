{{ config(materialized='view') }}

select
    genre,
    content_count,
    movie_count,
    tv_show_count,
    share_of_genre_assignments
from {{ source('netflix', 'genre_metrics') }}