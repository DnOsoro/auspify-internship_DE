"use client";

import { useEffect, useState } from "react";

type DashboardKpis = {
  total_titles_added: string | number;
  total_movies_added: string | number;
  total_tv_shows_added: string | number;
  movie_share: string | number;
  tv_show_share: string | number;
  peak_year: number;
  peak_year_additions: string | number;
  median_movie_runtime: string | number;
};

type YearlyTrend = {
  year_added: number;
  content_count: string | number;
  movie_count: string | number;
  tv_show_count: string | number;
  movie_share: number;
  tv_show_share: number;
  is_complete_year: boolean;
  period_status: string;
};

type CountryMetric = {
  country: string;
  content_count: string | number;
  movie_count: string | number;
  tv_show_count: string | number;
  share_of_country_assignments: number;
};

type GenreMetric = {
  genre: string;
  content_count: string | number;
  movie_count: string | number;
  tv_show_count: string | number;
  share_of_genre_assignments: number;
};

type RatingMetric = {
  rating: string;
  content_count: string | number;
  movie_count: string | number;
  tv_show_count: string | number;
  share_of_catalogue: number;
};

type AnalyticsResponse = {
  filters: {
    year: number | null;
    type: string | null;
    country: string | null;
    genre: string | null;
    rating: string | null;
  };
  kpis: {
    total_titles: number | string;
    total_movies: number | string;
    total_tv_shows: number | string;
    movie_share: number | string;
    tv_show_share: number | string;
    median_movie_runtime: number | string | null;
  };
  trends: YearlyTrend[];
  countries: { name: string; count: number }[];
  genres: { name: string; count: number }[];
  ratings: { name: string; count: number }[];
};

type DataQualityMetric = {
  metric: string;
  value: string | number;
  status: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="metric-card">
      <p className="eyebrow">{label}</p>
      <p className="metric-value">{value}</p>
      <p className="metric-detail">{detail}</p>
      <div className="connected">
        <span className="status-dot" />
        Verified project metric
      </div>
    </article>
  );
}

function HorizontalBars({
  items,
}: {
  items: { name: string; count: number }[];
}) {
  const max = Math.max(...items.map((item) => item.count));

  return (
    <div className="bar-list">
      {items.map((item) => (
        <div className="bar-row" key={item.name}>
          <span className="bar-name" title={item.name}>
            {item.name}
          </span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="bar-count">{formatNumber(item.count)}</span>
        </div>
      ))}
    </div>
  );
}

function YearlyChart({
  yearlyData,
  isLoading,
  trendError,
}: {
  yearlyData: YearlyTrend[];
  isLoading: boolean;
  trendError: boolean;
}) {
  const chartData = yearlyData
    .filter((item) => item.year_added >= 2012)
    .map((item) => ({
      year: item.year_added,
      count: Number(item.content_count),
      isComplete: item.is_complete_year,
    }));

  if (isLoading) {
    return <p className="chart-note">Loading yearly catalogue trends...</p>;
  }

  if (trendError) {
    return (
      <p className="chart-note" role="alert">
        Could not load yearly trends. Please refresh the page.
      </p>
    );
  }

  if (chartData.length < 2) {
    return <p className="chart-note">Not enough yearly data to draw the chart.</p>;
  }

  const width = 660;
  const height = 235;
  const left = 48;
  const right = 12;
  const top = 20;
  const bottom = 36;
  const maxValue = 2200;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const x = (index: number) =>
    left + (index / (chartData.length - 1)) * plotWidth;

  const y = (value: number) =>
    top + plotHeight - (value / maxValue) * plotHeight;

  const points = chartData
    .map((item, index) => `${x(index)},${y(item.count)}`)
    .join(" ");

  const area = `${left},${top + plotHeight} ${points} ${x(chartData.length - 1)},${top + plotHeight}`;

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="year-chart"
        role="img"
        aria-label="Titles added by year, peaking at 2,013 in 2019. The 2021 figure is incomplete."
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e50914" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#e50914" stopOpacity="0.015" />
          </linearGradient>
        </defs>

        {[0, 500, 1000, 1500, 2000].map((tick) => (
          <g key={tick}>
            <line
              x1={left}
              x2={width - right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="#292932"
              strokeDasharray="3 5"
            />
            <text
              x={left - 9}
              y={y(tick) + 4}
              fill="#858591"
              fontSize="11"
              textAnchor="end"
            >
              {tick.toLocaleString("en-US")}
            </text>
          </g>
        ))}

        <polygon points={area} fill="url(#areaFill)" />

        <polyline
          points={points}
          fill="none"
          stroke="#e50914"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {chartData.map((item, index) => (
          <g key={item.year}>
            <circle
              cx={x(index)}
              cy={y(item.count)}
              r={item.year === 2019 ? 5 : 3}
              fill={item.year === 2021 ? "#858591" : "#e50914"}
              stroke={item.year === 2019 ? "#ffffff" : "none"}
              strokeWidth="2"
            />
            {(item.year % 2 === 0 || item.year === 2019 || item.year === 2021) && (
              <text
                x={x(index)}
                y={height - 12}
                fill={item.year === 2021 ? "#d8a04b" : "#a0a0aa"}
                fontSize="11"
                textAnchor="middle"
              >
                {item.year}
                {item.year === 2021 ? "*" : ""}
              </text>
            )}
          </g>
        ))}

        <text
          x={x(chartData.findIndex((item) => item.year === 2019))}
          y={y(chartData.find((item) => item.year === 2019)?.count ?? 0) - 13}
          fill="#ffffff"
          fontSize="12"
          fontWeight="600"
          textAnchor="middle"
        >
          {formatNumber(chartData.find((item) => item.year === 2019)?.count ?? 0)}
        </text>
      </svg>
      <p className="chart-note">
        <span className="note-star">*</span> 2021 is an incomplete year in this dataset.
        Counts represent catalogue additions, not viewer demand.
      </p>
    </div>
  );
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  async function askAssistant(questionText: string) {
    const cleanedQuestion = questionText.trim();

    if (!cleanedQuestion || aiLoading) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "user", content: cleanedQuestion },
    ]);
    setQuestion("");
    setAnswer("");
    setAiError("");
    setAiLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: cleanedQuestion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "The assistant could not answer. Please try again.",
        );
      }

      if (typeof data.answer !== "string") {
        throw new Error("The assistant returned an unexpected response.");
      }

      setAnswer(data.answer);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.answer },
      ]);
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setAiLoading(false);
    }
  }

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedRating, setSelectedRating] = useState("");

  const [filterOptions, setFilterOptions] = useState<{
    years: number[];
    types: string[];
    countries: string[];
    genres: string[];
    ratings: string[];
  }>({
    years: [],
    types: [],
    countries: [],
    genres: [],
    ratings: [],
  });

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const response = await fetch("/api/filter-options");

        if (!response.ok) {
          throw new Error("Could not load filter options.");
        }

        const data = await response.json();
        setFilterOptions(data);
      } catch (error) {
        console.error("Failed to load filter options:", error);
      }
    }

    void loadFilterOptions();
  }, []);

  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  const kpis = analytics?.kpis ?? null;
  const kpiError = Boolean(analyticsError);

  const countryData = analytics?.countries ?? [];
  const countryError = Boolean(analyticsError);

  const genreData = analytics?.genres ?? [];
  const genreError = Boolean(analyticsError);

  const ratingData = analytics?.ratings ?? [];
  const ratingError = Boolean(analyticsError);

  useEffect(() => {
    async function loadAnalytics() {
      setAnalyticsLoading(true);
      setAnalyticsError("");

      try {
        const params = new URLSearchParams();

        if (selectedYear) params.set("year", selectedYear);
        if (selectedType) params.set("type", selectedType);
        if (selectedCountry) params.set("country", selectedCountry);
        if (selectedGenre) params.set("genre", selectedGenre);
        if (selectedRating) params.set("rating", selectedRating);

        const query = params.toString();
        const url = query
          ? `/api/analytics?${query}`
          : "/api/analytics";

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Could not load filtered analytics.");
        }

        const data: AnalyticsResponse = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to load analytics:", error);
        setAnalyticsError(
          error instanceof Error
            ? error.message
            : "Could not load analytics.",
        );
      } finally {
        setAnalyticsLoading(false);
      }
    }

    void loadAnalytics();
  }, [
    selectedYear,
    selectedType,
    selectedCountry,
    selectedGenre,
    selectedRating,
  ]);

  const [qualityData, setQualityData] = useState<DataQualityMetric[]>([]);
  const [qualityError, setQualityError] = useState(false);
  const [qualityLoading, setQualityLoading] = useState(true);
  const [filteredQualityData, setFilteredQualityData] = useState<DataQualityMetric[]>([]);
  const [filteredQualityError, setFilteredQualityError] = useState(false);
  const [filteredQualityLoading, setFilteredQualityLoading] = useState(true);

  useEffect(() => {
    async function loadDataQuality() {
      try {
        const response = await fetch("/api/data-quality");

        if (!response.ok) {
          throw new Error("Could not load data quality metrics");
        }

        const data: DataQualityMetric[] = await response.json();
        setQualityData(data);
      } catch (error) {
        console.error("Failed to load data quality metrics:", error);
        setQualityError(true);
      } finally {
        setQualityLoading(false);
      }
    }

    loadDataQuality();
  }, []);

  useEffect(() => {
    async function loadFilteredDataQuality() {
      setFilteredQualityLoading(true);
      setFilteredQualityError(false);

      try {
        const params = new URLSearchParams();

        if (selectedYear) params.set("year", selectedYear);
        if (selectedType) params.set("type", selectedType);
        if (selectedCountry) params.set("country", selectedCountry);
        if (selectedGenre) params.set("genre", selectedGenre);
        if (selectedRating) params.set("rating", selectedRating);

        const query = params.toString();
        const url = `/api/filtered-data-quality${query ? `?${query}` : ""}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Could not load filtered data quality metrics");
        }

        const data: { metrics: DataQualityMetric[] } =
          await response.json();

        setFilteredQualityData(data.metrics);
      } catch (error) {
        console.error(
          "Failed to load filtered data quality metrics:",
          error,
        );
        setFilteredQualityError(true);
      } finally {
        setFilteredQualityLoading(false);
      }
    }

    void loadFilteredDataQuality();
  }, [
    selectedYear,
    selectedType,
    selectedCountry,
    selectedGenre,
    selectedRating,
  ]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">N</div>

        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#overview">
            <span className="nav-icon">▦</span>
            <span>Overview</span>
          </a>
          <a className="nav-item" href="#trends">
            <span className="nav-icon">⌁</span>
            <span>Trends</span>
          </a>
          <a className="nav-item" href="#breakdown">
            <span className="nav-icon">◫</span>
            <span>Breakdown</span>
          </a>
        </nav>

        <div className="sidebar-bottom">DATA<br />LAB</div>
      </aside>

      <section className="main-content" id="overview">
        <header className="page-header">
          <div>
            <p className="section-kicker">DATA INTELLIGENCE / 01</p>
            <h1>Netflix Catalog Intelligence</h1>
            <p className="page-subtitle">
              A closer look at the catalogue, its composition, and historical trends.
            </p>
          </div>
          <div className="header-actions">
            <span className="date-chip">DATA THROUGH 25 SEP 2021</span>
            <a className="report-button" href="#insights">
              View insights <span aria-hidden="true">↗</span>
            </a>
          </div>
        </header>

        <section className="findings-panel" id="insights">
          <div className="findings-heading">
            <span className="red-indicator" />
            <span>AT A GLANCE</span>
            <span className="findings-caption">KEY PROJECT FINDINGS</span>
          </div>

          <div className="findings-grid">
            <div className="finding">
              <span className="finding-symbol">↗</span>
              <p className="finding-value">2019</p>
              <p className="finding-label">Peak year of catalogue additions</p>
              <p className="finding-detail">2,013 titles added</p>
            </div>
            <div className="finding">
              <span className="finding-symbol">◧</span>
              <p className="finding-value">69.7%</p>
              <p className="finding-label">Of the catalogue is movies</p>
              <p className="finding-detail">6,123 movies out of 8,786 titles</p>
            </div>
            <div className="finding">
              <span className="finding-symbol">◎</span>
              <p className="finding-value">97.67%</p>
              <p className="finding-label">Random Forest classification accuracy</p>
              <p className="finding-detail">Held-out test set: 1,758 records</p>
            </div>
          </div>
        </section>

        <div className="section-heading">
          <div>
            <p className="section-kicker">THE BIG PICTURE</p>
            <h2>Catalogue overview</h2>
          </div>
          <span className="live-label">
            <span className="status-dot" /> Pipeline metrics
          </span>
        </div>

        <section className="catalogue-filters" aria-label="Catalogue filters">
          <div className="filters-heading">
            <div>
              <p className="section-kicker">EXPLORE THE DATA</p>
              <h3>Filter catalogue</h3>
            </div>
            <button
              type="button"
              className="reset-filters"
              onClick={() => {
                setSelectedYear("");
                setSelectedType("");
                setSelectedCountry("");
                setSelectedGenre("");
                setSelectedRating("");
              }}
              disabled={
                !selectedYear &&
                !selectedType &&
                !selectedCountry &&
                !selectedGenre &&
                !selectedRating
              }
            >
              Reset filters
            </button>
          </div>

          <div className="filters-grid">
            <label className="filter-field">
              <span>Year added</span>
              <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
                <option value="">All years</option>
                {filterOptions.years.map((year) => (
                  <option key={year} value={String(year)}>{year}</option>
                ))}
              </select>
            </label>

            <label className="filter-field">
              <span>Content type</span>
              <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
                <option value="">All types</option>
                {filterOptions.types.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>

            <label className="filter-field">
              <span>Country</span>
              <select value={selectedCountry} onChange={(event) => setSelectedCountry(event.target.value)}>
                <option value="">All countries</option>
                {filterOptions.countries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </label>

            <label className="filter-field">
              <span>Genre</span>
              <select value={selectedGenre} onChange={(event) => setSelectedGenre(event.target.value)}>
                <option value="">All genres</option>
                {filterOptions.genres.map((genre) => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </label>

            <label className="filter-field">
              <span>Rating</span>
              <select value={selectedRating} onChange={(event) => setSelectedRating(event.target.value)}>
                <option value="">All ratings</option>
                {filterOptions.ratings.map((rating) => (
                  <option key={rating} value={rating}>{rating}</option>
                ))}
              </select>
            </label>
          </div>

          <p className="filters-note">
            {analyticsLoading
              ? "Updating catalogue metrics..."
              : `Showing ${formatNumber(Number(kpis?.total_titles ?? 0))} titles matching the selected filters.`}
          </p>
          {analyticsError && (
            <p className="filters-error" role="alert">{analyticsError}</p>
          )}
        </section>

        <section className="metrics-grid" aria-label="Catalogue KPIs">
          {kpiError && (
            <p role="alert">
              Could not load live KPIs. Please refresh the page.
            </p>
          )}

          <MetricCard
            label="TOTAL TITLES"
            value={kpis ? formatNumber(Number(kpis.total_titles)) : "Loading..."}
            detail="Cleaned records"
          />

          <MetricCard
            label="MOVIES"
            value={kpis ? formatNumber(Number(kpis.total_movies)) : "Loading..."}
            detail={kpis ? `${(Number(kpis.movie_share) * 100).toFixed(2)}% of catalogue` : "Loading database data"}
          />

          <MetricCard
            label="TV SHOWS"
            value={kpis ? formatNumber(Number(kpis.total_tv_shows)) : "Loading..."}
            detail={kpis ? `${(Number(kpis.tv_show_share) * 100).toFixed(2)}% of catalogue` : "Loading database data"}
          />

          <MetricCard
            label="PEAK YEAR ADDED"
            value={
              analyticsLoading
                ? "Loading..."
                : analytics?.trends.length
                  ? String(
                      analytics.trends.reduce((peak, item) =>
                        Number(item.content_count) > Number(peak.content_count)
                          ? item
                          : peak
                      ).year_added
                    )
                  : "—"
            }
            detail={kpis ? `${formatNumber(Number(analytics?.trends.reduce((peak, item) => Number(item.content_count) > Number(peak.content_count) ? item : peak, analytics.trends[0])?.content_count ?? 0))} titles added` : "Loading database data"}
          />
        </section>

        <section className="primary-grid" id="trends">
          <article className="panel trend-panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">HISTORICAL ACTIVITY</p>
                <h3>Titles added per year</h3>
              </div>
              <span className="mini-tag">2008–2021</span>
            </div>
            <YearlyChart
              yearlyData={analytics?.trends ?? []}
              isLoading={analyticsLoading}
              trendError={Boolean(analyticsError)}
            />
          </article>

          <article className="panel mix-panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">CONTENT COMPOSITION</p>
                <h3>Movies vs. TV shows</h3>
              </div>
            </div>

            {kpis ? (
              <>
                <div className="donut-layout">
                  <div
                    className="donut"
                    role="img"
                    aria-label={`${(Number(kpis.movie_share) * 100).toFixed(2)} percent movies and ${(Number(kpis.tv_show_share) * 100).toFixed(2)} percent TV shows`}
                    style={{
                      background: `conic-gradient(var(--red) 0% ${Number(kpis.movie_share) * 100}%, #5d6c82 ${Number(kpis.movie_share) * 100}% 100%)`,
                    }}
                  >
                    <div className="donut-center">
                      <strong>
                        {formatNumber(Number(kpis.total_titles))}
                      </strong>
                      <span>total titles</span>
                    </div>
                  </div>

                  <div className="legend">
                    <div className="legend-item">
                      <span className="legend-dot movie-dot" />
                      <div>
                        <p>Movies</p>
                        <strong>
                          {formatNumber(Number(kpis.total_movies))}
                        </strong>
                        <span>
                          {(Number(kpis.movie_share) * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="legend-item">
                      <span className="legend-dot show-dot" />
                      <div>
                        <p>TV shows</p>
                        <strong>
                          {formatNumber(Number(kpis.total_tv_shows))}
                        </strong>
                        <span>
                          {(Number(kpis.tv_show_share) * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mix-footnote">
                  <span>MEDIAN MOVIE RUNTIME</span>
                  <strong>
                    {kpis
                      ? `${Number(kpis.median_movie_runtime)} minutes`
                      : "Loading..."}
                  </strong>
                </div>
              </>
            ) : (
              <p className="chart-note">
                {kpiError
                  ? "Could not load content composition metrics."
                  : "Loading content composition..."}
              </p>
            )}
          </article>
        </section>

        <section className="breakdown-section" id="breakdown">
          <div className="section-heading compact-heading">
            <div>
              <p className="section-kicker">EXPLORE THE DETAILS</p>
              <h2>What is in the catalogue?</h2>
            </div>
            <span className="muted-copy">Ranked by record count</span>
          </div>

          <div className="breakdown-grid">
            <article className="panel breakdown-panel">
              <div className="panel-heading">
                <h3>Top countries</h3>
                <span className="panel-icon">◎</span>
              </div>
              {countryError && (
                <p className="chart-note" role="alert">
                  Could not load country data. Please refresh the page.
                </p>
              )}
              <HorizontalBars items={countryData} />
              <p className="panel-footnote">
                Country assignments can overlap; one title may list multiple countries.
              </p>
            </article>

            <article className="panel breakdown-panel">
              <div className="panel-heading">
                <h3>Top genres</h3>
                <span className="panel-icon">▤</span>
              </div>
              {genreError && (
                <p className="chart-note" role="alert">
                  Could not load genre data. Please refresh the page.
                </p>
              )}
              <HorizontalBars items={genreData} />
              <p className="panel-footnote">
                Titles may belong to more than one genre.
              </p>
            </article>

            <article className="panel breakdown-panel">
              <div className="panel-heading">
                <h3>Content ratings</h3>
                <span className="panel-icon">◈</span>
              </div>
              {ratingError && (
                <p className="chart-note" role="alert">
                  Could not load rating data. Please refresh the page.
                </p>
              )}
              <HorizontalBars items={ratingData} />
              <p className="panel-footnote">
                Missing and unrated classifications are grouped as Not Rated.
              </p>
            </article>
          </div>
        </section>

        <section className="quality-section" id="data-quality">
          <div className="section-heading compact-heading">
            <div>
              <p className="section-kicker">TRUST & RELIABILITY</p>
              <h2>Data Quality</h2>
              <p className="muted-copy">
                Validation checks from the curated Netflix catalogue.
              </p>
            </div>
            <span className="muted-copy">
              {qualityLoading
                ? "Loading checks..."
                : `${qualityData.length} checks`}
            </span>
          </div>

          {qualityError && (
            <p className="chart-note" role="alert">
              Could not load data quality metrics. Please refresh the page.
            </p>
          )}

          {!qualityLoading && !qualityError && (
            <div className="quality-grid">
              {qualityData.map((item) => (
                <article className="panel quality-card" key={item.metric}>
                  <div className="quality-card-top">
                    <span className="quality-metric-name">
                      {item.metric.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`quality-status quality-status-${item.status.toLowerCase()}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <strong className="quality-value">
                    {formatNumber(Number(item.value))}
                  </strong>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="quality-section" id="filtered-data-quality">
          <div className="section-heading compact-heading">
            <div>
              <p className="section-kicker">FILTERED VALIDATION</p>
              <h2>Filtered Data Quality</h2>
              <p className="muted-copy">
                Validation checks for the records matching your current filters.
              </p>
            </div>
            <span className="muted-copy">
              {filteredQualityLoading
                ? "Loading checks..."
                : `${filteredQualityData.length} checks`}
            </span>
          </div>

          {filteredQualityError && (
            <p className="chart-note" role="alert">
              Could not load filtered data quality metrics. Please refresh the page.
            </p>
          )}

          {!filteredQualityLoading && !filteredQualityError && (
            <div className="quality-grid">
              {filteredQualityData.map((item) => (
                <article
                  className="panel quality-card"
                  key={item.metric}
                >
                  <div className="quality-card-top">
                    <span className="quality-metric-name">
                      {item.metric.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`quality-status quality-status-${item.status.toLowerCase()}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <strong className="quality-value">
                    {formatNumber(Number(item.value))}
                  </strong>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="page-footer">
          <span>NETFLIX CATALOG INTELLIGENCE</span>
          <span>Python · PostgreSQL · dbt · Next.js</span>
          <span>Portfolio analytics project</span>
        </footer>
      </section>

      <aside className="assistant-panel">
        <div className="assistant-header">
          <div className="assistant-avatar">AI</div>
          <div>
            <p className="assistant-title">Data assistant</p>
            <p className="assistant-subtitle">Netflix catalogue insights · Gemini</p>
          </div>
          <span
            className="assistant-status"
            title={aiLoading ? "Thinking" : aiError ? "Request failed" : "AI assistant"}
            style={{ background: aiLoading ? "var(--amber)" : aiError ? "var(--red)" : "var(--green)" }}
          />
        </div>

        <div className="assistant-body">
          {messages.length === 0 && (
            <div className="assistant-welcome">
              <p className="section-kicker">ASK YOUR DATA</p>
              <h3>Find the story behind the numbers.</h3>
              <p>
                Ask about catalogue composition, yearly additions, genres,
                countries, ratings, and data quality.
              </p>

              <p className="suggestion-label">TRY A QUESTION</p>
              <div className="suggestion-list">
                {[
                  "Which year had the most additions?",
                  "How is the catalogue split between movies and TV shows?",
                  "What is the median movie runtime?",
                ].map((suggestion) => (
                  <button
                    className="suggestion"
                    key={suggestion}
                    type="button"
                    disabled={aiLoading}
                    onClick={() => void askAssistant(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div className="chat-messages" aria-live="polite">
              {messages.map((message, index) => (
                <div
                  className={`chat-message chat-message-${message.role}`}
                  key={`${message.role}-${index}`}
                >
                  <span className="chat-message-label">
                    {message.role === "user" ? "YOU" : "DATA ASSISTANT"}
                  </span>
                  <div className="chat-message-bubble">
                    <p>{message.content}</p>
                  </div>
                  {message.role === "assistant" && (
                    <span className="answer-source">
                      Source: project analytics · AI-generated interpretation
                    </span>
                  )}
                </div>
              ))}

              {aiLoading && (
                <div className="chat-message chat-message-assistant" role="status">
                  <span className="chat-message-label">DATA ASSISTANT</span>
                  <div className="chat-message-bubble chat-thinking">
                    Analysing project data and preparing an answer...
                  </div>
                </div>
              )}
            </div>
          )}

          {aiError && (
            <div className="assistant-notice" role="alert">
              <span className="notice-mark">!</span>
              <p>{aiError}</p>
            </div>
          )}
        </div>

        <form
          className="assistant-input-wrap"
          onSubmit={(event) => {
            event.preventDefault();
            void askAssistant(question);
          }}
        >
          <label className="sr-only" htmlFor="assistant-question">
            Ask a question about the Netflix catalogue
          </label>
          <div className="real-input-row">
            <textarea
              id="assistant-question"
              className="assistant-text-input assistant-textarea"
              rows={2}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void askAssistant(question);
                }
              }}
              placeholder="Ask a question about your Netflix catalogue…"
              maxLength={1000}
              disabled={aiLoading}
              required
            />
            <button
              className="assistant-send-button"
              type="submit"
              disabled={aiLoading || !question.trim()}
              aria-label="Send question"
            >
              {aiLoading ? "…" : "↗"}
            </button>
          </div>
          <p className="input-caption">
            AI responses can be wrong. Verify important figures.
          </p>
        </form>
      </aside>
    </main>
  );
}