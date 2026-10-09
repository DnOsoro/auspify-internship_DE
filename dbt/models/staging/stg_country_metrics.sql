{{ config(materialized='view') }}

select
    country,
    content_count,
    movie_count,
    tv_show_count,
    share_of_country_assignments
from {{ source('netflix', 'country_metrics') }}