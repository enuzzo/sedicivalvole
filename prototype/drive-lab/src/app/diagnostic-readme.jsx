import { APP_VERSION, APP_BUILD, APP_COMMIT } from "./build-info.js";

export function InstrumentMetric({ label, value, detail, tone = "neutral" }) {
  return (
    <div className={`instrument-metric is-${tone}`}>
      <dt>{label}</dt>
      <dd>
        <strong>{value}</strong>
        {detail ? <span>{detail}</span> : null}
      </dd>
    </div>
  );
}

export function DiagnosticReadme() {
  return (
    <div className="diagnostic-readme" id="diagnostic-readme" aria-labelledby="diagnostic-readme-title">
      <header>
        <small>TECHNICAL AND DATA NOTES</small>
        <h3 id="diagnostic-readme-title">What this instrument measures</h3>
        <p>
          The session report is a local performance instrument for the running Sedici Valvole session.
          It records bounded technical evidence so rendering, audio, GPS confidence, and
          failures can be compared without retaining a route.
        </p>
      </header>

      <section>
        <h4>Telemetry and privacy</h4>
        <ul>
          <li>No third-party analytics are enabled. Dev automatic reports are ON by default during this development phase; the visible switch turns them OFF.</li>
          <li>Coordinates are not collected, stored, copied, or included in a diagnostic.</li>
          <li>GPS evidence is limited to status, speed confidence, accuracy, and bounded counts.</li>
          <li>Dev can automatically send coordinate-free reports every 15 minutes of active session time, late when the browser froze the page, and best-effort when the app is closed or hidden. Standard sends only with SEND DIAGNOSTIC. Automatic sending has a visible OFF switch.</li>
          <li>The accepted report is attached as compressed JSON; server acceptance is not inbox delivery.</li>
        </ul>
      </section>

      <section>
        <h4>ATLAS location boundary</h4>
        <p>
          ATLAS may keep the latest reliable position in session memory while the map is
          selected. OpenFreeMap receives the tile area needed for the map and Wikimedia may
          receive a coarse nearby-search cell. OpenStreetMap Overpass receives a rounded area for nearby places. Opening Google Maps or Wikipedia shares the selected place with that service. These lookups never enter automatic technical reports.
        </p>
      </section>

      <section>
        <h4>Audio provenance</h4>
        <p>
          FRACTURE is an original generative score. JUNCTION is an original mixed production
          authored from 76 royalty-free MusicRadar source recordings. The source packs are not
          owned by this project and are never redistributed; the browser receives complete
          produced performances, not loose loops, stems, or samples.
        </p>
      </section>

      <section>
        <h4>Licensing and source</h4>
        <p>
          Original project code and documentation default to the PolyForm Noncommercial
          License 1.0.0. This is source-visible noncommercial software, not open source.
          Brand, screenshots, original audio, and standalone media remain outside that grant
          unless stated otherwise. Third-party components retain their own licences.
          Product and diagnostic text use Space Grotesk under the SIL Open Font License 1.1.
        </p>
        <nav aria-label="Technical source links">
          <a href="https://github.com/enuzzo/sedicivalvole" target="_blank" rel="noreferrer">SOURCE REPOSITORY</a>
          <a href="https://github.com/enuzzo/sedicivalvole/blob/main/THIRD_PARTY_NOTICES.md" target="_blank" rel="noreferrer">THIRD-PARTY NOTICES</a>
          <a href="https://github.com/enuzzo/sedicivalvole/blob/main/LICENSE-SCOPE.md" target="_blank" rel="noreferrer">LICENSE SCOPE</a>
          <a href="https://github.com/enuzzo/sedicivalvole/blob/main/docs/DIAGNOSTICS.md" target="_blank" rel="noreferrer">DIAGNOSTIC ARCHITECTURE</a>
        </nav>
      </section>

      <footer>
        <span>VERSION {APP_VERSION}</span>
        <span>BUILD {APP_BUILD}</span>
        <span>COMMIT {APP_COMMIT}</span>
      </footer>
    </div>
  );
}
