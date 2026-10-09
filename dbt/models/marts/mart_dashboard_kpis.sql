
{{ config(materialized='table') }}

select
    total_titles_added,
    total_movies_added,
    total_tv_shows_added,
    movie_share,
    tv_show_share,
    peak_year,
    peak_year_additions,
    median_movie_runtime
from {{ ref('int_catalogue_overview') }}