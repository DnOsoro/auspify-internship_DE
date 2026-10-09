-- Netflix analytical views
-- These views expose business-ready metrics for the dashboard.


-- ============================================================
-- 1. Catalogue summary
-- ============================================================

CREATE OR REPLACE VIEW netflix.v_catalogue_summary AS
SELECT
    SUM(content_count) AS total_titles_added,
    MAX(content_count) AS peak_year_additions,
    (
        SELECT year_added
        FROM netflix.yearly_trends
        WHERE is_complete_year = TRUE
        ORDER BY content_count DESC
        LIMIT 1
    ) AS peak_year,
    COUNT(*) FILTER (
        WHERE is_complete_year = TRUE
    ) AS complete_years,
    COUNT(*) FILTER (
        WHERE is_complete_year = FALSE
    ) AS incomplete_years
FROM netflix.yearly_trends;


-- ============================================================
-- 2. Country metrics
-- ============================================================

CREATE OR REPLACE VIEW netflix.v_top_countries AS
SELECT
    country,
    content_count,
    movie_count,
    tv_show_count,
    share_of_country_assignments
FROM netflix.country_metrics
ORDER BY content_count DESC;


-- ============================================================
-- 3. Genre metrics
-- ============================================================

CREATE OR REPLACE VIEW netflix.v_top_genres AS
SELECT
    genre,
    content_count,
    movie_count,
    tv_show_count,
    share_of_genre_assignments
FROM netflix.genre_metrics
ORDER BY content_count DESC;


-- ============================================================
-- 4. Rating distribution
-- ============================================================

CREATE OR REPLACE VIEW netflix.v_rating_distribution AS
SELECT
    rating,
    content_count,
    movie_count,
    tv_show_count,
    share_of_catalogue
FROM netflix.rating_metrics
ORDER BY content_count DESC;


-- ============================================================
-- 5. Forecast summary
-- ============================================================

CREATE OR REPLACE VIEW netflix.v_forecast_summary AS
SELECT
    forecast_year,
    forecast_content_count,
    model,
    forecast_type,
    status
FROM netflix.forecasts
ORDER BY forecast_year;