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

function YearlyChart() {
  const [yearlyData, setYearlyData] = useState<YearlyTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trendError, setTrendError] = useState(false);

  useEffect(() => {
    async function loadTrends() {
      try {
        const response = await fetch("/api/trends");

        if (!response.ok) {
          throw new Error("Could not load catalogue trends");
        }

        const data: YearlyTrend[] = await response.json();
        setYearlyData(data);
      } catch (error) {
        console.error("Failed to load yearly trends:", error);
        setTrendError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadTrends();
  }, []);

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
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [kpiError, setKpiError] = useState(false);

  const [countryData, setCountryData] = useState<
    { name: string; count: number }[]
  >([]);
  const [countryError, setCountryError] = useState(false);

  const [genreData, setGenreData] = useState<
    { name: string; count: number }[]
  >([]);
  const [genreError, setGenreError] = useState(false);

  const [ratingData, setRatingData] = useState<
    { name: string; count: number }[]
  >([]);
  const [ratingError, setRatingError] = useState(false);

  const [qualityData, setQualityData] = useState<DataQualityMetric[]>([]);
  const [qualityError, setQualityError] = useState(false);
  const [qualityLoading, setQualityLoading] = useState(true);

  useEffect(() => {
    async function loadKpis() {
      try {
        const response = await fetch("/api/kpis");

        if (!response.ok) {
          throw new Error("Could not load dashboard KPIs");
        }

        const data: DashboardKpis = await response.json();
        setKpis(data);
      } catch (error) {
        console.error("Failed to load dashboard KPIs:", error);
        setKpiError(true);
      }
    }

    loadKpis();
  }, []);

  useEffect(() => {
    async function loadCountries() {
      try {
        const response = await fetch("/api/countries");

        if (!response.ok) {
          throw new Error("Could not load country metrics");
        }

        const data: CountryMetric[] = await response.json();

        setCountryData(
          data.map((item) => ({
            name: item.country,
            count: Number(item.content_count),
          })),
        );
      } catch (error) {
        console.error("Failed to load country metrics:", error);
        setCountryError(true);
      }
    }

    loadCountries();
  }, []);

  useEffect(() => {
    async function loadGenres() {
      try {
        const response = await fetch("/api/genres");

        if (!response.ok) {
          throw new Error("Could not load genre metrics");
        }

        const data: GenreMetric[] = await response.json();

        setGenreData(
          data.map((item) => ({
            name: item.genre,
            count: Number(item.content_count),
          })),
        );
      } catch (error) {
        console.error("Failed to load genre metrics:", error);
        setGenreError(true);
      }
    }

    loadGenres();
  }, []);

  useEffect(() => {
    async function loadRatings() {
      try {
        const response = await fetch("/api/ratings");

        if (!response.ok) {
          throw new Error("Could not load rating metrics");
        }

        const data: RatingMetric[] = await response.json();

        setRatingData(
          data.map((item) => ({
            name: item.rating,
            count: Number(item.content_count),
          })),
        );
      } catch (error) {
        console.error("Failed to load rating metrics:", error);
        setRatingError(true);
      }
    }

    loadRatings();
  }, []);

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

        <section className="metrics-grid" aria-label="Catalogue KPIs">
          {kpiError && (
            <p role="alert">
              Could not load live KPIs. Please refresh the page.
            </p>
          )}

          <MetricCard
            label="TOTAL TITLES"
            value={kpis ? formatNumber(Number(kpis.total_titles_added)) : "Loading..."}
            detail="Cleaned records"
          />

          <MetricCard
            label="MOVIES"
            value={kpis ? formatNumber(Number(kpis.total_movies_added)) : "Loading..."}
            detail={kpis ? `${(Number(kpis.movie_share) * 100).toFixed(2)}% of catalogue` : "Loading database data"}
          />

          <MetricCard
            label="TV SHOWS"
            value={kpis ? formatNumber(Number(kpis.total_tv_shows_added)) : "Loading..."}
            detail={kpis ? `${(Number(kpis.tv_show_share) * 100).toFixed(2)}% of catalogue` : "Loading database data"}
          />

          <MetricCard
            label="PEAK YEAR ADDED"
            value={kpis ? String(kpis.peak_year) : "Loading..."}
            detail={kpis ? `${formatNumber(Number(kpis.peak_year_additions))} titles added` : "Loading database data"}
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
            <YearlyChart />
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
                        {formatNumber(Number(kpis.total_titles_added))}
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
                          {formatNumber(Number(kpis.total_movies_added))}
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
                          {formatNumber(Number(kpis.total_tv_shows_added))}
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
            <p className="assistant-subtitle">Project insights · Preview</p>
          </div>
          <span className="assistant-status" title="Preview mode" />
        </div>

        <div className="assistant-body">
          <div className="assistant-intro">
            <p className="section-kicker">ASK YOUR DATA</p>
            <h3>Find the story behind the numbers.</h3>
            <p>
              The assistant panel is a preview. We will connect it to the
              project's actual data and AI service in a later step.
            </p>
          </div>

          <p className="suggestion-label">TRY THESE QUESTIONS</p>
          <div className="suggestion-list">
            <div className="suggestion">Which year had the most additions?</div>
            <div className="suggestion">How is the catalogue split?</div>
            <div className="suggestion">How did the classifier perform?</div>
          </div>

          <div className="sample-answer">
            <span className="answer-label">PROJECT FACT</span>
            <p>
              The cleaned dataset contains <strong>8,786 titles</strong>.
              Movies account for 6,123 records and TV shows account for 2,663.
            </p>
            <span className="answer-source">Source: verified dbt dashboard KPIs</span>
          </div>

          <div className="assistant-notice">
            <span className="notice-mark">i</span>
            <p>
              No live AI connection yet. Answers will be grounded in project
              data once the API is implemented.
            </p>
          </div>
        </div>

        <div className="assistant-input-wrap">
          <div className="fake-input">
            <span>Ask a question about your data…</span>
            <span className="send-icon">↗</span>
          </div>
          <p className="input-caption">AI responses can be wrong. Verify important figures.</p>
        </div>
      </aside>
    </main>
  );
}