import { useState, useRef, useEffect, useMemo } from "react";
import { discoverPreferredLanguage, DISCOVER_INITIAL_VISIBLE_RESULTS, discoverWikipediaSearchUrl, discoverWikipediaUrl, normalizeDiscoverPages, discoverWikipediaContinuationUrl, discoverViewPages, discoverGoogleMapsUrl, DISCOVER_LANGUAGE_OPTIONS, discoverWikipediaArticleUrl, discoverVisibleResultCapacity } from "../discover/discover-model.js";
import { createPlaceLoader } from "../environments/atlas/place-loader.js";
import { nearbyOsmUrl, normalizeNearbyOsm } from "../environments/atlas/osm-places.js";
import { combineDiscoverPlaces } from "../discover/discover-places.js";
import { RailIcon } from "../rail-icon.jsx";
import { DialogSurface } from "./dialog-surface.jsx";

const DISCOVER_VIEWS = Object.freeze([
  { id: "nearby", label: "NEARBY" },
  { id: "ahead", label: "AHEAD" },
  { id: "region", label: "REGION" },
]);

export function DiscoverPanel({ position, onClose, onRetryLocation, onDemoLocation }) {
  const [language, setLanguage] = useState(() => discoverPreferredLanguage(
    typeof navigator === "undefined" ? ["en"] : (navigator.languages ?? [navigator.language]),
  ));
  const [view, setView] = useState("nearby");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [pages, setPages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [visibleResultCapacity, setVisibleResultCapacity] = useState(DISCOVER_INITIAL_VISIBLE_RESULTS);
  const [reloadToken, setReloadToken] = useState(0);
  const [status, setStatus] = useState(position ? "loading" : "location");
  const [error, setError] = useState("");
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [mapsQrUrl, setMapsQrUrl] = useState("");
  const resultsRef = useRef(null);

  const [osmPages, setOsmPages] = useState([]);
  const [osmStatus, setOsmStatus] = useState("loading");
  const positionRef = useRef(position);
  positionRef.current = position;
  useEffect(() => {
    setOsmPages([]);
    setOsmStatus("loading");
    const loader = createPlaceLoader({
      readPosition: () => positionRef.current,
      canLoad: () => !document.hidden && navigator.onLine !== false,
      intervalMs: 300000,
      load: async (origin, signal) => {
        const url = nearbyOsmUrl(origin);
        if (!url) return [];
        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error(`OpenStreetMap returned ${response.status}`);
        return normalizeNearbyOsm(await response.json(), origin, language);
      },
      onResult: setOsmPages,
      onState: setOsmStatus,
    });
    const recover = () => document.hidden || navigator.onLine === false ? loader.pause() : loader.wake();
    document.addEventListener("visibilitychange", recover);
    window.addEventListener("online", recover);
    window.addEventListener("offline", recover);
    void loader.start();
    return () => {
      loader.dispose();
      document.removeEventListener("visibilitychange", recover);
      window.removeEventListener("online", recover);
      window.removeEventListener("offline", recover);
    };
  }, [language]);

  const globalSearchActive = Boolean(debouncedQuery);
  const queryPending = query.trim() !== debouncedQuery;
  const requestUrl = useMemo(() => (
    globalSearchActive
      ? discoverWikipediaSearchUrl(debouncedQuery, { language, requestLimit: 35 })
      : discoverWikipediaUrl(position, { language, view, requestLimit: 35 })
  ), [debouncedQuery, globalSearchActive, language, position?.latitude, position?.longitude, view]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    const timeout = window.setTimeout(() => setDebouncedQuery(normalizedQuery), 320);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setPages([]);
    setSelectedId(null);
  }, [language]);

  useEffect(() => {
    if (!requestUrl) {
      setStatus("location");
      setPages([]);
      setSelectedId(null);
      return undefined;
    }
    const controller = new AbortController();
    setStatus("loading");
    setError("");
    setPages([]);
    setSelectedId(null);
    (async () => {
      const mergedPages = new Map();
      let nextUrl = requestUrl;
      for (let requestIndex = 0; requestIndex < 4 && nextUrl; requestIndex += 1) {
        const response = await fetch(nextUrl, { signal: controller.signal });
        if (!response.ok) throw new Error(`Wikipedia returned ${response.status}`);
        const payload = await response.json();
        for (const page of payload?.query?.pages ?? []) {
          const key = String(page?.pageid ?? page?.title ?? mergedPages.size);
          mergedPages.set(key, { ...(mergedPages.get(key) ?? {}), ...page });
        }
        const candidatePages = normalizeDiscoverPages(
          { query: { pages: [...mergedPages.values()] } },
          position,
          15,
          { searchRanked: globalSearchActive },
        );
        if (candidatePages.length >= 15) break;
        const continuationUrl = discoverWikipediaContinuationUrl(requestUrl, payload?.continue);
        nextUrl = continuationUrl && continuationUrl !== nextUrl ? continuationUrl : null;
      }
      return normalizeDiscoverPages(
        { query: { pages: [...mergedPages.values()] } },
        position,
        15,
        { searchRanked: globalSearchActive },
      );
    })()
      .then((nextPages) => {
        setPages(nextPages);
        setSelectedId((current) => (
          current ?? nextPages[0]?.id ?? null
        ));
        setStatus(nextPages.length ? "ready" : "empty");
      })
      .catch((nextError) => {
        if (nextError?.name === "AbortError") return;
        setPages([]);
        setSelectedId(null);
        setError(nextError?.message || "Wikipedia is unavailable right now.");
        setStatus("error");
      });
    return () => controller.abort();
  }, [globalSearchActive, reloadToken, requestUrl]);

  const filteredPages = useMemo(() => {
    if (queryPending) return [];
    const combined = combineDiscoverPlaces(pages, osmPages, position, debouncedQuery);
    if (globalSearchActive) return combined;
    return discoverViewPages(combined, { view, heading: position?.heading });
  }, [debouncedQuery, globalSearchActive, pages, osmPages, position, queryPending, view]);
  const selected = filteredPages.find((page) => page.id === selectedId) ?? filteredPages[0] ?? null;
  const visiblePages = filteredPages.slice(0, visibleResultCapacity);
  const remainingPages = filteredPages.slice(visibleResultCapacity);
  const hiddenCount = remainingPages.length;
  const mapsUrl = discoverGoogleMapsUrl(selected);
  const languageLabel = DISCOVER_LANGUAGE_OPTIONS.find((item) => item.id === language)?.label ?? language;
  const articleUrl = useMemo(() => selected?.source === "Wikipedia" ? discoverWikipediaArticleUrl(selected.title, { language }) : null, [language, selected]);

  useEffect(() => {
    let active = true;
    setNavigationOpen(false);
    setMapsQrUrl("");
    if (!mapsUrl) return () => { active = false; };
    import("qrcode").then(({ default: QRCode }) => QRCode.toDataURL(mapsUrl, {
      width: 320,
      margin: 1,
      color: { dark: "#070909", light: "#EEEAE0" },
      errorCorrectionLevel: "M",
    })).then((dataUrl) => {
      if (active) setMapsQrUrl(dataUrl);
    }).catch(() => {
      if (active) setMapsQrUrl("");
    });
    return () => { active = false; };
  }, [mapsUrl]);

  useEffect(() => {
    const element = resultsRef.current;
    if (!element) return undefined;
    const updateCapacity = () => {
      const nextCapacity = discoverVisibleResultCapacity(element.clientHeight, filteredPages.length);
      setVisibleResultCapacity((current) => (current === nextCapacity ? current : nextCapacity));
    };
    updateCapacity();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateCapacity);
      return () => window.removeEventListener("resize", updateCapacity);
    }
    const observer = new ResizeObserver(updateCapacity);
    observer.observe(element);
    return () => observer.disconnect();
  }, [filteredPages.length]);

  useEffect(() => {
    resultsRef.current?.scrollTo({ top: 0 });
  }, [language, query, view]);

  const renderResult = (page, index) => (
    <button
      key={page.id}
      data-discover-result-index={index}
      type="button"
      className={selected?.id === page.id ? "is-selected" : ""}
      aria-pressed={selected?.id === page.id}
      onClick={() => setSelectedId(page.id)}
    >
      {page.thumbnail ? <img src={page.thumbnail} alt="" /> : <img className="is-placeholder" src={`/third-party/tabler-icons/${page.source === "OpenStreetMap" ? "map-search" : "brand-wikipedia"}.svg`} alt="" aria-hidden="true" />}
      <span>
        <strong>{page.title}</strong>
        <em>{globalSearchActive
          ? (Number.isFinite(page.distanceMetres) ? page.distanceLabel : "GLOBAL RESULT")
          : `${page.distanceLabel} · ≈ ${page.estimatedMinutes} min`} · {page.source}</em>
      </span>
    </button>
  );

  const revealRemainingResults = () => {
    const firstRemaining = resultsRef.current?.querySelector(`[data-discover-result-index="${visibleResultCapacity}"]`);
    if (!firstRemaining) return;
    firstRemaining.focus({ preventScroll: true });
    firstRemaining.scrollIntoView({
      block: "nearest",
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  return (
    <DialogSurface className="diagnostic-drawer discover-drawer" labelledBy="discover-title" onClose={onClose}>
      <header className="discover-heading">
        <div>
          <h2 id="discover-title">Discover</h2>
          <small>Passenger Index</small>
        </div>
        <div className="discover-heading-actions">
          <button data-dialog-initial-focus type="button" onClick={onClose}>CLOSE</button>
        </div>
      </header>

      <div className="discover-workspace">
        <aside className="discover-index" aria-label="Places index">
          <div className="discover-tools">
            <label>
              <span className="visually-hidden">Wikipedia language</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Wikipedia language">
                {DISCOVER_LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="discover-search">
              <span className="visually-hidden">Search places</span>
              <img src="/third-party/tabler-icons/search.svg" alt="" aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search places" />
            </label>
          </div>

          <div className="discover-view-tabs" aria-label="Discover scope">
            {DISCOVER_VIEWS.map((item) => (
              <button key={item.id} type="button" className={view === item.id ? "is-active" : ""} aria-pressed={view === item.id} onClick={() => setView(item.id)}>{item.label}</button>
            ))}
          </div>

          <div ref={resultsRef} className="discover-results" aria-live="polite" aria-busy={status === "loading"}>
            {visiblePages.map(renderResult)}
            {hiddenCount ? (
              <button className="discover-more" type="button" onClick={revealRemainingResults} aria-label={`Show ${hiddenCount} more places`}>
                +{hiddenCount} MORE <span aria-hidden="true" />
              </button>
            ) : null}
            {remainingPages.map((page, index) => renderResult(page, visibleResultCapacity + index))}
            {status === "loading" || queryPending ? (
              <p className="discover-status"><span aria-hidden="true" />{query.trim() ? `Searching Wikipedia globally in ${languageLabel}…` : `Finding places in ${languageLabel}…`}</p>
            ) : null}
            {status === "location" ? (
              <div className="discover-empty-state">
                <strong>Location required</strong>
                <p>Location is required for nearby scopes. You can still search Wikipedia globally above.</p>
                <div><button type="button" onClick={onRetryLocation}>RETRY GPS</button><button type="button" onClick={onDemoLocation}>MILAN DEMO</button></div>
              </div>
            ) : null}
            {status === "error" ? (
              <div className="discover-empty-state"><strong>Wikipedia unavailable</strong><p>{error}</p><button type="button" onClick={() => setReloadToken((current) => current + 1)}>TRY AGAIN</button></div>
            ) : null}
            {!filteredPages.length && (status === "empty" || status === "ready") && (!position || osmStatus === "empty" || osmStatus === "ready") ? (
              <div className="discover-empty-state"><strong>No matching places</strong><p>{globalSearchActive ? "Try another global Wikipedia search or language." : "Try another scope, language, or global search."}</p></div>
            ) : null}
          </div>
          <p className="discover-privacy">Wikipedia · {languageLabel} · {globalSearchActive ? "global" : "nearby"}<br />
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a> · nearby points
            {position && osmStatus === "loading" ? " · loading…" : osmStatus === "retrying" ? " · retrying…" : ""}
          </p>
        </aside>

        <article className="discover-reader" aria-live="polite">
          {selected ? (
            <>
              <header>
                <div>
                  <small>SELECTED PLACE</small>
                  <h3>{selected.title}</h3>
                  <span className="discover-reader-meta">{globalSearchActive
                    ? (Number.isFinite(selected.distanceMetres) ? `${selected.distanceLabel} away` : "Global Wikipedia result")
                    : `${selected.distanceLabel} · ≈ ${selected.estimatedMinutes} min drive`}</span>
                </div>
                {mapsUrl ? (
                  <button
                    type="button"
                    className="discover-navigation-trigger"
                    aria-expanded={navigationOpen}
                    aria-controls="discover-navigation-handoff"
                    onClick={() => setNavigationOpen((open) => !open)}
                  >
                    <span>SEND TO NAVIGATION</span>
                    <RailIcon name="navigation" />
                  </button>
                ) : null}
              </header>
              <div className="discover-reader-body">
                {articleUrl ? (
                  <iframe
                    key={articleUrl}
                    className="discover-article-frame"
                    title={`${selected.title} — complete Wikipedia article`}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
                    referrerPolicy="origin"
                    src={articleUrl}
                  />
                ) : (
                  <div className="discover-article-fallback" aria-live="polite">
                    {selected.thumbnail ? <img src={selected.thumbnail} alt="" /> : <img className="is-placeholder" src={`/third-party/tabler-icons/${selected.source === "OpenStreetMap" ? "map-search" : "brand-wikipedia"}.svg`} alt="" aria-hidden="true" />}
                    <div>
                      <strong>{selected.source === "OpenStreetMap" ? "Mapped place" : "Complete article unavailable"}</strong>
                      <p>{selected.summary || "Wikipedia has no short introduction for this place."}</p>
                      {selected.source === "OpenStreetMap" ? <>
                        <p>A named OpenStreetMap point near your location. Map categories are community supplied; an article may not be available.</p>
                        {selected.wikipediaUrl ? <a href={selected.wikipediaUrl} target="_blank" rel="noreferrer">READ LINKED WIKIPEDIA ARTICLE</a> : null}
                      </> : null}
                    </div>
                  </div>
                )}
                {navigationOpen ? (
                  <section id="discover-navigation-handoff" className="discover-navigation-handoff" aria-labelledby="discover-navigation-title">
                    <div className="discover-navigation-card">
                      <header>
                        <div><small>PHONE → TESLA</small><h4 id="discover-navigation-title">Send this place to the car</h4></div>
                        <button type="button" onClick={() => setNavigationOpen(false)} aria-label="Close navigation handoff">CLOSE</button>
                      </header>
                      <div>
                        {mapsQrUrl ? <img src={mapsQrUrl} width="176" height="176" alt={`Google Maps QR code for ${selected.title}`} /> : <span className="discover-navigation-qr-placeholder">BUILDING QR…</span>}
                        <ol>
                          <li>Scan the QR code to open this place in Google Maps without starting navigation.</li>
                          <li>Refine the pin, explore nearby, or choose Directions when you are ready.</li>
                          <li>Use Share and choose the Tesla app to send your final choice.</li>
                          <li>Tesla can then pass that destination to the car navigation.</li>
                        </ol>
                        <p>Official alternative: Tesla app → Locations → Navigate → Send to Car.</p>
                      </div>
                    </div>
                  </section>
                ) : null}
              </div>
              <footer className="discover-reader-source">
                <span>{selected.source.toUpperCase()}{selected.source === "Wikipedia" ? ` · ${language.toUpperCase()}` : ""}</span>
                <a href={selected.url} target="_blank" rel="noreferrer">OPEN ON {selected.source.toUpperCase()} <img src="/third-party/tabler-icons/external-link.svg" alt="" aria-hidden="true" /></a>
              </footer>
            </>
          ) : (
            <div className="discover-reader-placeholder">
              <img src="/third-party/tabler-icons/brand-wikipedia.svg" alt="" aria-hidden="true" />
              <strong>Passenger reading, ready when the road is.</strong>
              <span>Select a place from the index to keep its story open here.</span>
            </div>
          )}
        </article>
      </div>
    </DialogSurface>
  );
}
