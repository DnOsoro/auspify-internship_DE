{{ config(materialized='view') }}

with yearly_summary as (

    select
        year_added,
        content_count,
        is_complete_year
    from {{ ref('stg_yearly_trends') }}
    where is_complete_year = true

),

peak_year as (

    select
        year_added as peak_year,
        content_count as peak_year_additions
    from yearly_summary
    order by content_count desc
    limit 1

),

catalogue_totals as (

    select
        sum(content_count) as total_titles_added,
        sum(movie_count) as total_movies_added,
        sum(tv_show_count) as total_tv_shows_added,
        round(
            sum(movie_count)::numeric
            / nullif(sum(content_count), 0),
            4
        ) as movie_share,
        round(
            sum(tv_show_count)::numeric
            / nullif(sum(content_count), 0),
            4
        ) as tv_show_share
    from {{ ref('stg_yearly_trends') }}

),

runtime_summary as (

    select median_movie_runtime
    from {{ ref('int_movie_runtime') }}

)

select
    catalogue_totals.total_titles_added,
    catalogue_totals.total_movies_added,
    catalogue_totals.total_tv_shows_added,
    catalogue_totals.movie_share,
    catalogue_totals.tv_show_share,
    peak_year.peak_year,
    peak_year.peak_year_additions,
    runtime_summary.median_movie_runtime
from catalogue_totals
cross join peak_year
cross join runtime_summary