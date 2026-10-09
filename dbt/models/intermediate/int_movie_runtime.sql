
{{ config(materialized='view') }}

select
    percentile_cont(0.5)
        within group (order by movie_minutes)
        as median_movie_runtime
from {{ source('netflix', 'netflix_titles') }}
where type = 'Movie'
  and movie_minutes is not null