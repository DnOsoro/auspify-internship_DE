{{ config(materialized='view') }}

select
    rating,
    content_count,
    movie_count,
    tv_show_count,
    share_of_catalogue
from {{ source('netflix', 'rating_metrics') }}