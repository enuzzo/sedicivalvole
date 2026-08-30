# Sedicivalvole Work Plan

Status: initial repository-backed map created on 2026-08-30. This is a plan,
not an implementation record. The external request document
`sedicivalvole-richieste-riordinate.md` was treated as proposed product intent;
repository code, tests, licences, and already-recorded decisions were inspected
independently. External service, API, and licence claims in that document have
not yet been re-verified against current primary sources except where this plan
records a dated public check explicitly.

## Questions for the product owner

Reply with one short line per number. Each question contains a proposed default
and a concrete acceptance boundary; no dependent implementation should begin
until its answer is recorded here.

1. **M5c — retired-source record:** An external generative source considered in
   the original request was explicitly removed by the owner on 2026-08-30. No
   login, PDF archive, local audition, API integration, API key, credit spend,
   product reference, or recurring reminder is required.

2. **Coverage count:** The document says 59 content IDs plus 24 Q IDs, but a
   deterministic parse finds **73 bracketed content IDs plus 24 Q IDs = 97**.
   May this plan use the actual 97-ID set and preserve every one? **Proposed:
   yes; acceptance: the coverage matrix remains 97/97 unless the source document
   is corrected explicitly.**

   Answer: yes

3. **Q15 / L5 / X6 — command protocol:** Section 11 simultaneously marks this
   as open and instructs the agent to respect it as decided. Do you confirm that
   the LAB and passenger controller must use one typed command protocol, never
   direct scene calls? **Proposed: yes; acceptance: `param`, `command`, and
   `state` messages pass schema, ordering, permission, and reconnect tests.**

   Answer: non capisco la domanda, mi fido del tuo consiglio

4. **T1 — macro envelopes:** Should every visual consume the actual shared audio
   macro envelope for OPEN, UNDERWATER, and BLOOM, rather than inventing a second
   visual attack/release time? **Proposed: yes; acceptance: one envelope per
   macro, identical across scenes, while speed-response attack/release remains a
   separate tunable mapping.**

  Answer: si, sono d'accordo, spero che qeusto risolva anche il problema che in alcune tracce come quella con anni 80, al momento, underwater non si sente veramente apparire come effetto, lo leggo sulla ui, ma a orecchio e' quasi impercettibile, e vorrei he invece fosse molto marcato, in ogni scena, ogni effetto deve essere molto marcato - inoltre open non avviene quasi mai, e bloom non ho nemmeno capito cosa sia e quando avvenga :-) puoi chiarirmelo? e possiamo renderli piu' evidenti, ingrandendo il loro sfondo e carattere quando vengono usati?

5. **Q1 / P2 — 100 versus 130 km/h:** Should particle *scale* reach and hold its
   maximum at `100 km/h`, while the product's existing speed/energy ceiling stays
   `130 km/h` for all other responses? **Proposed: yes; acceptance: scale is
   monotonic from 0 to 100 and saturated from 100 to 260 without altering the
   global `ROAD_SPEED_CEILING_KMH`.**

   answer: si certo, la cosa che ci importa e' che si veda bene il cambio di dimensione da 0 a 100/130km, e viceversa, che sia smooth, per tutto il resto accetto il tuo consiglio

6. **Q10 / D3 — truncated DRIVEY request:** What exact additional behavior must
   occur at `0 km/h` beyond a motionless, road-centred player car? **Acceptance:
   one observable sentence that can become a deterministic test.**

   Answer: giusto cosi' e mi basta, l'auto deve sempre gia' restare al centro della strada e ferma, basta questo, e ricordati di togliere i veicoli che appaiono lungo la nostra stessa carreggiata, non quelli in senso opposto, se e' impossibile rimuovere solo quelli dal nostro lato, rimuovili tutti, perche' durante la guida sembra che gli andiamo addosso al paraurti posteriore .. non bello e confortante mentre si guida ;-) quindi .. o solo cars in senso opposto .. o niente

7. **Q4 / A1 — camera ownership:** ATLAS already returns to the live automatic
   camera after six idle seconds. Should that verified behavior remain?
   **Proposed: yes; acceptance: manual pitch/bearing/zoom holds while touched and
   one fresh automatic return begins after `6000 ms`.**

   answer: yes

8. **A1 — pitch range and limits:** Is a hard-clamped `0–85°` MapLibre pitch
   acceptable, where `0°` is vertical and `85°` is the near-horizon limit?
   **Proposed: yes, no elastic overscroll; acceptance: touch and mouse reach both
   endpoints without camera jumps.**

   answer: penso di si, devo vederli in scena ma per ora mi fido del tuo senso

9. **Q5 / A2 / X1 — Wikipedia in motion:** May the passenger reading panel be
   opened at any speed? **Proposed: yes; acceptance: it never pauses the
   experience, traps focus correctly, and remains passenger-side in the selected
   shared-overlay direction.**

   answer: yes, and also add a control with a small A and a large A to change the text size for reading and another control to change the background of the page from white (not pure white) and dark, per aiutare le persone a leggeremeglio quando sono passeggeri e consultano wikipedia

   RICHIESTA EXTRA SULLE PALETTE COLORI: quando siamo a full screen appaiono troppo grandi, inutile scalarle cosi' tanto, diamo una dimensione massima e lasciamole pure allineate a destra quando siamo in full screen

   ALTRA RICHIESTA CHE MI VIENE IN MENTE: a volte la UI non si nasconde dopo averla evocata, e i pannelli navbar e footer restano aperti a oltranza, non sonr iuscito a determinare con certezza quando, replicando il bug, ma ti prego di controllare e verificare che sia consistente sempre il comportamento - dopo 5 secondi si puo' nascondere automaticamente sempre

10. **Q6 / S1 — on-screen macros in motion:** May the central display expose the
    complete macro range while moving? **Proposed: only while parked on the car
    display; full-range control remains available from an authorised passenger
    phone. Acceptance: the motion policy is explicit and testable.**

   answer: preferirei che fsosero sempre disponibili e non solo quando siamo parcheggiati - ma se vuoi, quando l'auto e' parcheggiata e siamo in full screen puoi offrire un interfaccia piu' ricca - tutto deve essere fattibile anche in movimento e anche dal passeggero che non usa lo smartphoone per controllare

11. **X1 / X2 — visual gate:** Do you confirm that exactly three shared overlay
    and screen-zone directions must be shown before A2, S1, M2, or S5 changes the
    product UI? **Proposed: yes, as required by `AGENTS.md`; acceptance: one
    direction is selected and recorded before implementation.**

    answer: sinceramente non mi ricordo quei punti ma mi fido del tuo consiglio, ok

12. **Q14 / S2g — participants:** Should a session admit at most four passenger
    devices, all with the same granted controls, rather than making later devices
    read-only? **Proposed: yes; acceptance: the fifth connection is rejected with
    clear local copy and existing participants remain connected.**

   answer: si, va benissimo, accetto e fai anche in modo che i controlli si aggiornino live su ogni dispositivo, cosi' ogni persona  ha un telecomando "live" della situazione attuale, gli slider, knob, visual e interfaccia che verranno riportati sullo smartphone, si aggiornano in tempo reale per tutti i telefoni connessi - ricordiamoci anche di mostrare sul display che ci sono connessioni avvenute da smartphones, e quante - altra richiesta che mi viene in mente, per l ascritta GPS in alto sulla navbar, basta scrivere GPS in verde se connesso, e in rosso barrato se non connesso, e se si preme il rosso, ci da il popup/tooltip di come attivarlo in tesla, con icone reali che spieghino dove cliccare esattamente e cosa attivare - inoltre, se possibile far apparire la precisione e i tempi di risposta in piccolo, numericamente sotto alla scritta gps - fai in mdo che tutta la navbar sia ben disegnata e coerente e ordinata, chiedendo a frontend ui di valutar;a

13. **S2e — inactivity:** Should a passenger session die after 15 minutes with no
    connected controller and no command? **Proposed: yes; acceptance: expiry,
    regeneration, revocation, and disconnect invalidate the room token
    immediately.**

     answer: la connessione resta attiva finche' la sessione in auto non si distrugge, magari un passeggero vuole chiudere il telefono per un po' .. e  venti minuti dopo riaprirlo e trovare tutto ancora funzionante, la sessione deve durare, e il pilota, dalla sua interfaccia a schermo, dove indichiamo se e quanti tel host sono connessi, puo' revocarli tutti, in modo da refreshare, nel caso ci siano problemi di connessione - ogni connessione e' identficata con un nome random figo fatto di due parole fighe e nerd (come gli attributi che assegna diablo al personaggio scelto, fatto di aggettivo e attributo o non ricordo, cerca, ma piu' nerd) - cosi' possiamo anche staccarne uno per uno con una x, dal tooltip/popup/overlay, oppure con un tasto unico anche tutti

14. **S2i — score handoff:** Is this safe boundary acceptable: an outgoing
    adaptive score finishes its current eight-bar phrase; when SOUNDTRACK is the
    outgoing source, the target adaptive score starts at its own phrase zero as
    soon as it is ready; every handoff uses the existing equal-power mix and
    exposes a visible pending state? **Proposed: yes; acceptance: no adaptive
    score starts mid-phrase and no request waits more than one eight-bar phrase
    after preload.**

    answer: non capisco bene la domanda, se e' importante richiedimelo, per quanto riguarda le soundtrack, a parte gli effetti sonori di distorsione in frenata, accelerazione ecc (ricordati di metter eun tasto per attivarli e disattivarli accanto al mute, e che mostrino chiaramente in centro schermo che e' avvenuto) - se la domanda riguarda la energy .. le soundtrack non hanno quel problema, non cambiano con velocita' ed energia, solo distorsione al comportamento dell'auto, o distorsioni musicali knob fatte con il sistema di distorsioni per "giocare" con il suono

15. **S3 — passenger feature name:** May the function be named **PATCH**?
    **Proposed: PATCH; acceptance: the same single name is used in UI, protocol,
    documentation, and diagnostics.**

    non mi piace proprio "patch" e' fuorviante, ci vuole qualcsoa di carino tipo "COPLAY" o qualcosa che sia inequivoabile, "TUNE THE ROAD" .. o "COPILOT DJ" .. si deve capire e deve essere emozionante e desiderabile ed essere accompagnato da una icona che faccia capire che e' multiutente

16. **Q21 / S4 — effect-state persistence:** Should the effects master always
    start enabled in a fresh page session rather than persist its last state?
    **Proposed: yes; acceptance: reload resets to enabled and disabling during a
    macro releases through its normal envelope.**

    answer: si, sempre persistenti, sempre suono ed effetti attivi, come da tua proposta

17. **Q17 / M8 — SOUNDTRACK base:** Do you confirm Jamendo plus directly licensed
    Illobo material as the first SOUNDTRACK sources, subject to fresh terms and
    API verification? **Proposed: yes; acceptance: no source enters the catalog
    before M11 passes and notices are recorded.**

    si, per me va bene, ora ti procuro anche tutte le tracce di illobo, per jamendo guidami nella creazione di una API e onora la loro licenza. A previously mentioned external generative source and its delivery proposal were later removed by the owner and are no longer part of this plan.

18. **Q16 / X8 — ND material:** May ND tracks be excluded at query time by
    default, with no “effects disabled” exception unless measured filtered
    coverage proves the catalog unusable? **Proposed: yes; acceptance: the two
    `fullcount` measurements are preserved and no ND item reaches the engine.**

answer: non so cosa intendi per ND, ma mi fido della tua valutazione

NOTA: per illobo, ricordiamoci di mettere un qr che porti al suo soundcloud (https://soundcloud.com/illobo) anzi .. mi dice che da soundcloud e' tutto scaricabile, quindi se vuoi le prendiamo da li'

    ALTRA NOTA IMPORTANTE PER GLI EFFETTI CON CUI GIOCARE A DISTORCERE LE TRACCE MANUALMENTE, a quelli che hai pensato tu, aggiungi in piu' anche: flanger, riverbero, chorus, beat repeat - devono essere molto notabili quando si usano, l'utente deve divertirsi a giocare con la traccia

19. **Q23 / M1d / M1e — rhythm mode:** Should speed-following rhythm bands be the
    default, with a manual band overriding it until the user explicitly restores
    automatic mode? **Proposed: yes; acceptance: the active mode and band are
    always visible and deterministic.**

    answer: yes - ovviamente la soundtrack non e' influenzata da velocita' e ritmo/energy, solo le tracce generative e sample - cosi' come chiamiamo "SOUNDTRACK" quella che non e' modificabil, magari chiamiamo "PLAY THE ROAD" la sezione dinamica? e scriviamo sotto al bottone iniziale in piccolo cosa significa - cpsa ne dici se dopo lo splash screen parta subito un secondo breve splashscreen che chieda se si vuole play the road, soundtrack o mute? .. proprio per partire con un aiutino, e appena partita l'interfaccia, solo una volta, ogni singolo "bottone" o oggetto cliccabile faccia un rapido scale up e glow, per far capire che l'interfaccia e' viva e pronta a rispondere, in sequenza, il tutto che duri meno di 4s

20. **Q18 / M8 — Freesound:** Should a separate, licence-filtered Freesound study
    be opened for FRACTURE source material? **Proposed: yes, research only;
    acceptance: no audio enters the repository or product during the study.**

    answer: non capisco, ma se lo ritieni, si

21. **Q25 / M8 — StreamBeats:** Should the custom-licence email be deferred until
    SOUNDTRACK works with its confirmed initial sources? **Proposed: yes;
    acceptance: StreamBeats remains absent from code, UI, and notices meanwhile.**

    answer: Streambeats ha cazzi storti con licenze, filtri sulla musica ecc, abbandoniamolo totalmente, restiamo con jamendo

22. **Q9 / M3 — Illobo scope:** Do you already hold a written grant covering
    public web playback, audiovisual use, real-time effects, and any required
    hosting? **Answer `yes` or `no`; acceptance: a private dated copy is archived
    and only its scope, never the private message, is documented publicly.**

    answer: mi assumo il 100% di responsabilita' di dirti che illobo ci consente di usare il 100% del suo materiale e promuoverlo al massimo come featured content, se vuoi poi ti do una conferma scritta ma sono l'umano a comando e ti confermo che c'e', senza che tu mi faccia da avvocato per questo caso specifico di illobo, il suo soundcloud ha tutto e scarichiamo tutto: https://soundcloud.com/illobo

23. **M7 — public contact:** Which public contact address may appear in the music
    removal policy? **Acceptance: one explicit non-private address supplied by
    you; no address is inferred from local configuration.**

    direi di scrivermi direttamente su github senza esporre la mia identita' o mail, che dici? altrmenti enuzzo@gmail.com - tanto github mi notifica in mail subito

24. **M1 / M1b — NIGHTSHIFT placement:** Should the current adaptive NIGHTSHIFT
    remain available inside a nested sampled/adaptive collection under JUNCTION,
    while the top level becomes exactly FRACTURE, JUNCTION, and SOUNDTRACK?
    **Proposed: yes; acceptance: no authored score disappears and SOUNDTRACK is
    the only non-adaptive top-level score.**

    Come detto prima, dividiamo in due blocchi, la musica "play the road" che accorpa fracture, junction e nightshift, e l'altro di soundtracks, poi diviso sia per generi che per velocita' (jamendo le supporta entrambe)

25. **Q3 / PP2 — PRIMORDIAL reference:** Which exact image/video/file is the
    target, and what licence or direct permission applies? **Acceptance: one
    immutable reference identity and a recorded reuse boundary before any visual
    proposal or code change.**

  answer: qua trovi tutto : https://codepen.io/shubniggurath/pen/NXGbBo - non ci sono esplicitate licenze, copia lo stesso identico shader, e ricorda di metterlo in coda nel nostro README come "fonti" di tutto! ricorda di documentare TUTTO nel nostro readme, su fonti di TUTTO, compreso vertigo da tympanus ecc, tutto nominabile

26. **Q12 / G8 — Strudel source exposure:** Has anyone involved in the planned
    clean implementation already read Strudel source code rather than only its
    public documentation? **Answer `yes` or `no`; acceptance: the research-source
    boundary is recorded before G8 resumes.**

    strudel: abbiamo deciso di abbandonarlo al 100% .. no prob, a meno che, se vuoi, ti fai tu un giro, ti puoi scaricare la repo nella nostra cartella non tracciata, studiarla, e imparare qualcosa studiando il codice di come si compongono tracce in modo rapido e dinamico con nomenclatura musicale e per effetti, potrebbe esserti utile da imparare come clean room, ma il progetto in se' non lo ereditiamo o copiamo o integriamo, ma lo studiamo, quello si' . .deriva tu idee utili per integrare, rifattorizzare o riconsiderare quello che facciamo alla luce di un progetto che ha risolto gia molti problemi

27. **M4 / G3 / X5 — current AGPL reality:** The repository is already
    `AGPL-3.0-or-later`, so client-side keys and decryption logic are public even
    without Strudel. May client obfuscation be abandoned and protected local
    sources use only server-authorised, short-lived segmented delivery?
    **Proposed: yes; acceptance: documentation never calls client delivery
    encryption or protection.**

    answer: si, va benissimo, posso prepararti un server alternativo, o un terzo livello di sedicivalvole.app, tipo dev.sedicivalvole.app (o dimmi tu come) e li' ci metti quello che ti serve, e lo proteggi e gestisci tu, ti do ftp completo - ricordati che distribuiamo il progetto su github, quindi ovviamente non esporre dati miei o server miei nella conf che condividi su github, mandiamo un sample conf

28. **A3b — street-name source:** May the badge use only client-side
    `queryRenderedFeatures` data from the already displayed OpenFreeMap tiles,
    with no new reverse-geocoding service? **Proposed: yes; acceptance: missing
    names produce no badge and no coordinate leaves through a new request.**

    answer: si certo!

29. **M13 — vehicle software:** No browser API exposes the Tesla software
    version. May the canary record `vehicleSoftware: unavailable` unless the
    platform later provides it, rather than add a manual field? **Proposed: yes;
    acceptance: the report is truthful and never invents a version.**

    answer: si certo, se vuoi e se si puo', puoi ricavarlo dalla diagnostica, e in quel caso implementalo e alla prossima guida ti mando un altro pacchetto e lo mando

30. **L4 — preset schema:** Is schema version `1`, ISO-8601 UTC `exportedAt`,
    scene ID, app version, build, commit, and grouped `form/response/macros`
    acceptable? **Proposed: yes; acceptance: export/import round-trips exactly
    and rejects unknown major versions.**

    answer: non capisco bene ;-) quindi mi fido della tua proposta, yes

31. **M2 / S2i — SOUNDTRACK skip:** Should normal-track skip use a `450 ms`
    equal-power crossfade, inside the requested `300–600 ms` range?
    **Proposed: yes; acceptance: no click, silence, double playback, or stale
    metadata over rapid repeated requests.**

    answer: si

32. **M13 / baseline — local toolchain:** May implementation first establish an
    architecture-safe local dependency runtime instead of overwriting the
    Dropbox-synchronised `node_modules`? **Proposed: yes; acceptance: Node and
    native packages share one architecture, PHP-dependent tests are explicitly
    available or skipped only as an environment limitation, and Git remains
    clean.**

    answer: il contesto e' che usiamo codex sia su una macchina intel che su una macchina silicon, e quindi puoi scegliere tu la strategia migliore perche' quando siamo su ogni macchina, tu possa lavorare con tutti gli strumenti che ti servono, sia li puoi mettere in dropbox che fuori, seza alcun problema, importante e' che hi tutto quel che ti serve e che funzioni bene e sia aggiornato e te ne prendi cura :-)

RISPOSTE/DOMANDE mie: se cambiassimo AGPL in qualcos'altro, mi cambierebbe qualcosa? non sono chiare per me le licenze - quindi non capisco bene cosa comporta o meno questo tipo di licenza che abbiamo scelto, riguardo ai nostri brani o meno - mi fai un brevissimo recap, così posso scegliere se cambiarla o meno? ascolto anche il tuo consiglio -

Importante: prima di partire con qualasiasi piano, visto ch eleggerai queste risposte, elaborale, e poi dimmi se dobbiamo cambiare qualcosa, se ti serve ancora qualcosa o se vuoi che io perfezioni delle risposte.


## Owner-answer evaluation — 2026-08-30

The owner answers above are preserved verbatim as decision evidence. This
section evaluates them without silently rewriting intent. A delegated answer
(`I trust your recommendation`) adopts the proposal stated in the corresponding
question unless this review explicitly identifies a conflict.

### Decisions now settled

| Scope | Recorded owner decision | Plan impact |
| --- | --- | --- |
| Coverage and protocol | Preserve all 97 stable IDs; LAB and passenger control use the same typed protocol. | Q15 is resolved; L5/X6 move from pending to planned. |
| Project identity | The sole original project creator and public licensor identity is `enuzzo`; no studio or company identity is claimed. Third-party credits remain intact. | Active product copy, metadata, notices, licence scope and current documentation use `enuzzo`. Historical changelog entries remain immutable evidence of earlier builds. |
| Shared response and PRTCL | Use the same audio macro envelope in every visual; PRTCL scale reaches and holds its maximum at 100 km/h while the global ceiling remains 130 km/h. | T1/P2 are unblocked. Perceptual strength is added to the acceptance gate, not left as an aesthetic note. |
| DRIVEY | At zero the player car only needs to remain road-centred and motionless. Prefer opposing traffic only; if lane direction cannot be classified reliably, remove all NPC traffic. The owner accepts the current published Drivey presentation on 2026-08-30. | D1–D3 are accepted at the current product level. Target-Tesla observation remains evidence rather than a design blocker. Deferred D4 may later raise the Aerial camera smoothly with speed without altering Hood or Rear. |
| ATLAS | Preserve the six-second camera return, provisionally allow 0–85° pitch, allow Wikipedia while moving, and add reader text-size plus warm-light/dark themes. | Q4/Q5 resolve; A1/A2 acceptance expands. The exact visual treatment still waits for the mandatory three-direction gate. |
| In-motion controls | Central-display music macros remain usable while moving; parked/fullscreen may add a richer surface. | Q6 resolves in favour of availability at any speed. Interaction size, distraction and passenger reach remain Tesla acceptance checks. |
| Passenger session | Maximum four phones, authoritative live state on every phone, persistent room lifetime until the car session ends, individual/all revocation, participant count, and memorable random two-word aliases. | Q14 resolves; S2d–S2g acceptance expands. There is no 15-minute inactivity expiry. |
| Passenger naming | `PATCH` is rejected. `COPLAY`, `TUNE THE ROAD`, and `COPILOT DJ` are candidates, paired with an unmistakable multi-user icon. | S3 remains a naming/design selection, not a missing requirement. Exactly three directions will be presented before product copy changes. |
| Source structure | Product music is split into `PLAY THE ROAD` (FRACTURE, JUNCTION, NIGHTSHIFT) and `SOUNDTRACK` (fixed recordings browsed by source-supported genre and pace metadata). | M1/M1b/M1c are corrected; NIGHTSHIFT is not nested under JUNCTION and SOUNDTRACK is not speed-remixed. |
| SOUNDTRACK sources | Jamendo plus owner-authorised Illobo are the initial sources; StreamBeats is permanently rejected; Freesound remains research-only if useful. | Q17/Q18/Q25 resolve. M8 removes StreamBeats and cannot admit material before M11 evidence. |
| Jamendo readiness | The owner confirms that Jamendo API access is already prepared and selects it as the first SOUNDTRACK integration path. A secret-safe live check on 2026-08-30 returned API success, three distinct tracks from three artists, the required credit/catalogue fields, and a `206 audio/mpeg` range response from one stream. The app needs read methods only: request/read-only scope where available, keep OAuth redirect and client secret empty unless a future approved feature genuinely requires them, and register `https://sedicivalvole.app/` as the application home. | Operational connectivity is verified, not source admission: the sample included different Creative Commons capability sets, so M11 must still accept or reject each track and effect path. Keep the client ID outside Git, browser code, logs, screenshots, and documentation; only the future server boundary may use it. The public application description must disclose that the app is free, experimental, source-visible and noncommercial, has no advertising/subscription/paid-music/sponsorship/track monetisation, and includes an optional project-support link unrelated to music access. |
| Jamendo continuity and rotation | Maintain three transient browser-media slots—previous, current, next—with their metadata. Use only the stream `audio` URL and browser-native `preload=auto`; never fetch/store complete audio as application blobs, Cache Storage, IndexedDB, service-worker entries, or download files. Replenish each consumed next slot with a fresh eligible track and keep bounded recent-track/artist memory. | This is operational skip/back/forward readiness, not an offline feature or an 8–10-minute guarantee. The browser decides how much media it buffers. Each displaced slot is released promptly. If connectivity exhausts the available buffer, SOUNDTRACK pauses with visible network/retry state and resumes when possible; the owner explicitly rejects automatic fallback to PLAY THE ROAD. |
| Artist value and attribution | Treat credit as a first-class but low-clutter interaction: a compact now-playing/credit affordance in the navbar or selected corner opens a card with cover thumbnail, artist, track, optional album, licence, `Provided by Jamendo`, and direct track/artist destination exposed by touch plus QR. | M10 and X2 include this closed-by-default card in the three-direction visual gate. It must not cover the driving field until invoked; singles work without album metadata; no Jamendo logo/brand styling is modified or implied without an approved official asset. |
| Retired external source | Excluded from the current product, source catalogue, authoring workflow, local audition, and runtime. | M5/M5b/M5c are closed, not left as evidence gates. Reopening requires a future explicit owner decision plus fresh model-specific terms and cost review. |
| Generative API economics | No metered generative API may run per listener, playback, skip, reconnect, or session. | If a future source is approved, generation is an offline authoring action only; the resulting fixed asset still requires explicit public playback, hosting, and distribution rights before admission. |
| Illobo | The owner attests that all Illobo recordings may be used, processed, hosted as required, and prominently featured. Link/QR points to `https://soundcloud.com/illobo`. | Q9 is owner-resolved. A private written confirmation is still recommended evidence but is not treated as a second permission gate. Downloads still need a per-file provenance inventory. |
| Public contact | Use the public repository's GitHub Issues route, not a public email address. | M7 is unblocked without exposing identity or email. |
| Backend and secrets | Abandon claims of client-side protection. Use a separate evidence-selected backend, short-lived delivery authorisation, and public sample configuration only. | Q13/M4/X5 resolve. FTP access alone does not prove WebSocket, process, TLS, or secret-storage capability; M6 must audit the host before choosing a subdomain. |
| Diagnostics and toolchain | Derive Tesla software information only when the diagnostics package explicitly supports it; otherwise report unavailable. Keep per-architecture dependencies outside the Dropbox-synchronised checkout when native packages differ. The two supplied real-Tesla reports become the first field baseline for GPS, render pacing, cold-cache music readiness, long tasks and event retention. | M13 and the baseline gate are approved without overwriting another Mac's dependency state. Phase 0 also preserves significant events separately from high-rate GPS samples, attributes long tasks to time/phase, and reproduces adaptive-bank startup on a cold constrained connection. |
| Network observability | M13 now provides detailed session counters/rates and a deterministic non-visual state for active transfer, constrained estimate, offline, recent request failure, recovery, quiet online and unavailable evidence. Add the compact non-blocking navbar notice during the X2/GPS revamp. | X2 still owns placement and visual hierarchy. Navbar stays quiet when healthy. REPORT labels browser estimates separately from observed app traffic and never claims device-wide or carrier-wide totals. |
| Strudel | Reject the product, dependency, fork and source-derived rewrite. Do not download/read its source under a “clean-room” label; official Strudel guidance itself says source-informed clones are derivative. Public documentation or general music theory may be researched without importing source. | Q12 resolves as no source exposure; G7 remains final and G8 stays paper/documentation-only unless separately reopened. |
| Repository licence direction | The owner selects source-visible, non-commercial licensing for original sedicivalvole material. Existing AGPL copies keep the rights already granted; third-party and directly authorised material keeps its own case-by-case terms. | Phase 0 completed the file-family audit and synchronized PolyForm Noncommercial across the operative licence, scope, notice, metadata, README, product copy and decision log. No blanket non-commercial claim is applied to GPL or other third-party material. |
| Effects default | Every fresh page session starts sound and effects enabled. Turning the effects master off is session-only and is not restored after reload. | Q21/S4 is closed with option A. Disable/re-enable still uses the normal click-free envelope and central confirmation. |
| Adaptive-score handoff | Switching FRACTURE/JUNCTION/NIGHTSHIFT responds immediately through the existing four-second equal-power crossfade; the selected score begins at its own phrase zero. | S2i is closed with option A. `QUEUED` and waiting for an outgoing eight-bar phrase are rejected for ordinary user selection. SOUNDTRACK skip remains a separate 450 ms crossfade. |
| Initial launch structure | After the opening `PLAY THE ROAD` action, use one short screen with two visible sections—`MUSIC` and `VISUAL`—and one final `START` action. | The owner selected direction 03, **Instrument Deck**, then selected direction 03 **Road Sheet** as its visual language. The warm-light sheet is implemented with concise per-choice descriptions, explicit Music + Visual resolution, and MUTE retaining its chosen Visual. Its compact `72 px` header groups the 16 Road mark with the adjacent Orbitron wordmark; Music and Visual use identical compact padding/spacing, and their complete button areas have the same measured `342 px` top, bottom, and height at `773 × 601`. The Visual grid derives its row count so a third `108.66 px` row compacts inside that fixed block. SOUNDTRACK is visible but disabled until its player exists; Illobo featured belongs inside that later library. |
| Corner language | Use the existing shared `6 px` radius for buttons, cards, panels, and other visible framed surfaces; do not leave standalone product UI with sharp corners. | `--ui-radius: 6px` is the single design token. The Instrument Deck and its regression check establish the rule; older touched surfaces migrate to it during their planned revamp. |
| PRIMORDIAL replacement | The current project-authored PRIMORDIAL is rejected and retired from the product. `SF1` becomes a new original Gradient Field using project-authored WebGL/3D mechanics, with ShaderGradient, FeralUI and ColorFlow retained only within their audited reference boundaries. | Remove PRIMORDIAL as a selectable/persisted destination with Aperture migration. Preserve its history in Git/changelog rather than erasing evidence. Before Gradient Field implementation, present exactly three directions and admit no third-party shader, runtime, preset, export, embed or asset without its own licence gate. |
| New stable IDs | `A5` DISCOVER, `X9` Visual Library, `X10` Appearance, `X11` CONDITIONS, and `SF1` Gradient Field are approved. | These IDs are internal traceability keys and do not force final product copy. |

### Every side note mapped into the ledger

| Owner note | Tracked under | Acceptance added by this review |
| --- | --- | --- |
| UNDERWATER is nearly inaudible in NIGHTSHIFT/1980s material; OPEN is rare; BLOOM is unclear. | T1, S1, S5, X3 | Per-score audio measurements plus cabin listening; effect trigger telemetry; pronounced but level-safe sound; simultaneous visual response; a larger temporary effect badge. |
| Fullscreen palettes become oversized and should stay right-aligned with a maximum size; rebalance the footer areas so Mute, Visual, Music, and Palette form one harmonious composition instead of stretching the colour rail. | X2, X9 | Exact-viewport and fullscreen screenshots enforce a compact maximum palette width, right anchoring, stable swatch proportions, and deliberate footer column distribution. |
| Make the product genuinely iPhone-friendly in landscape; portrait should show a clear request to rotate the device instead of exposing the interactive driving surface. | X2 | Coarse-pointer phone viewports from `667 × 375` through `932 × 430` keep the launcher, top bar, REPORT, contextual controls and footer usable around iPhone safe areas with no clipping or horizontal scroll. Portrait makes the underlying product inert behind a full-viewport, keyboard- and screen-reader-readable rotation notice. Rotating to landscape removes the notice without a reload, duplicate AudioContext, lost selection, or restarted music/renderer; desktop portrait-like windows and Tesla `773 × 601` remain unaffected. |
| Preserve a future iPhone accelerometer input so sedicivalvole can react to a friend's car while playing through a Bluetooth speaker. | `FI-001`; future input-adapter work | Capture it in `docs/FUTURE-IDEAS.md` without scheduling implementation. Prefer an honest motion-reactive first spike: accelerometer data can improve transient response but cannot claim accurate absolute speed without drift control or GPS fusion. Require explicit iOS permission, parked calibration, bounded session-only samples, truthful confidence/degraded states, real iPhone and friend's-car fixtures, and no automatic fallback or fabricated `km/h`. |
| Nice to have: make DRIVEY's Aerial view rise or zoom out smoothly as road speed increases. | D4, T1 | Defer without reopening the accepted Drivey checkpoint. Prefer a bounded T1-driven camera-height response in the project-owned bridge; Hood and Rear remain unchanged, no upstream file changes, and owner review compares 0/40/100/130 km/h. |
| Top/footer chrome sometimes remains open indefinitely; always hide it five seconds after the latest invocation. | X2 | Deterministic timer tests cover repeated invoke, pointer/touch, modal ownership and visibility changes. |
| GPS status should be green when live and red/struck when unavailable, with accuracy/cadence below it and illustrated Tesla enablement help. | X2, M13 | Navbar information hierarchy, truthful stale/error states, numeric accuracy/cadence, and a real-icon help overlay are included in the three-direction gate. |
| Users should be able to see whether data is moving and recognise a network problem; DIAG should show downloaded/uploaded MB, current rates, and session peaks. | X2, M13 | Navbar shows only actionable state/activity. DIAG reports exact app-managed payload bytes where instrumented, observable resource-transfer bytes where exposed, estimated browser downlink/RTT only when supported, and `unavailable` otherwise. Totals reset per page session and exclude unrelated Tesla traffic, protocol overhead the browser does not expose, cache hits, and opaque cross-origin transfers. |
| Keep about three Jamendo tracks ready for skip/back/forward, rotate them after listening, avoid automatic mode fallback, and expose rich artist/track credit without permanent driving clutter. | M2, M8–M11, X2 | Use transient previous/current/next browser media elements with `preload=auto`, never application-owned audio storage and never an offline-duration promise. On exhausted buffer, SOUNDTRACK pauses/retries and remains selected. The closed-by-default navbar/corner credit card uses API-provided title, artist, optional album, image, licence URL and direct content page. |
| All phones should reflect current sliders, knobs, visual and selection state live; car shows count and permits individual/all revocation. | S2d–S2g | Authoritative snapshots/revisions reconcile every controller after join/reconnect and revocation wins over queued commands. |
| Manual fun effects should include flanger, reverb, chorus and beat repeat, and be strongly perceptible. | S1, M11 | The three-direction macro design must cover these desired characters without exposing raw DSP or applying derivatives where source rights forbid them. |
| After `PLAY THE ROAD`, one short owner-approved launch screen must collect both the initial music choice—PLAY THE ROAD, SOUNDTRACK or MUTE—and the initial Visual before entering the experience; one-time sub-four-second control glow/scale onboarding should then reveal interactivity. | M1, M2, X2, X9 | Use two visible sections, `MUSIC` and `VISUAL`, followed by one `START` action. Do not auto-enter after choosing only Music; MUTE still requires a Visual. The interaction structure is closed, while its styling joins the exactly-three-direction gate; keyboard/touch order, reduced motion and repeat-visit behavior remain testable. |
| Effects master sits beside Mute and produces central confirmation. | S4, S5 | Default state, click-free envelope release and large non-blocking confirmation are tested together. |
| Add a rich nearby-place discovery grid with imagery, concise context and a Google Maps handoff, possibly outside ATLAS. | A2, A3b, X1/X2, M13, plus a new owner-assigned entry | Treat DISCOVER as a companion surface rather than more permanent ATLAS chrome. Reuse its ephemeral location/heading and source adapters, keep coordinates out of persistence/diagnostics, and present exactly three visual directions before implementation. |
| Replace the growing flat Visual list with grouped, direct-selection buttons. | X2 plus a new owner-assigned Visual Library entry | Keep one tap from the open library to selection. Present all groups together rather than hiding visuals behind nested category pages; validate button density, active state, focus order and real current-build imagery in exactly three directions at `773 × 601`. |
| Add `LIGHT`, `DARK`, and location-aware `AUTO` appearance modes. | X1/X2 plus a new owner-assigned Appearance entry | Theme shared chrome, dialogs and reading surfaces without recolouring the active visual or its selected palette. Match the current official Tesla Model 3 Light illustration as a measured reference, then verify on the target vehicle. Manual modes persist; AUTO first follows the browser colour-scheme signal if Tesla exposes its native Appearance setting, otherwise it falls back to session-only solar context without storing coordinates. |
| Restore local weather to the queue, but avoid duplicating the Tesla forecast. | DISCOVER, M13, plus a new owner-assigned Conditions entry | Defer a generic forecast panel. Explore a quiet, exception-led road-context card: significant precipitation onset, temperature change, gusts or poor visibility, plus weather-aware DISCOVER suggestions. Retain an optional 6/12-hour and tomorrow detail view outside primary driving chrome. |
| Study ShaderGradient, FeralUI Gradient Builder, and ColorFlow as references for another speed-responsive visual. | T1, L1–L3, X2, plus a new owner-assigned Shader Field entry | Combine only independently authored mechanics: optional displaced depth from ShaderGradient, palette/family authoring discipline from FeralUI, and lightweight control-mesh/perceptual-flow ideas from ColorFlow. Start with a project-authored one-pass direct-WebGL2 planar mesh; do not admit any package, source, embed, preset, export, shader, or asset before its exact licence and notice gate. Drive bounded time, topology and macro envelopes from T1; profile pixel-density-1 rendering on Tesla; present exactly three visual directions before implementation. |
| SoundCloud says tracks are downloadable. | M3, M8, M11 | Platform download availability is recorded separately from the owner's direct permission and from public playback/hosting provenance. |
| README must document every source, including VERTIGO/Tympanus and visual references. | M7, M11 | README, NOTICE, licence scope, source-admission record and third-party notices are reconciled from one audited inventory. |
| Local MP3s from a subsequently retired source were offered for audition. | M5/M5b/M5c | Superseded by the owner's later decision to remove that source. `_references/` remains untracked and the files are not inspected, auditioned, copied, admitted, or used. |

### DISCOVER companion proposal — 2026-08-30

`DISCOVER` is the working name for a passenger-oriented place-discovery surface,
not a new permanent layer inside the ATLAS map. ATLAS remains the immediate map
and travel context; DISCOVER turns the same ephemeral location context into an
editorial grid that answers “what is interesting around and ahead of us?”. It is
reachable from ATLAS and the selected shared navigation direction, but opening,
closing, loading, or failing must never change the active visual or music mode.

The first bounded product slice is:

- **Nearby:** a diverse grid of image-led place cards around the current coarse
  area, with progressive radius expansion when the immediate area is sparse;
- **Ahead:** when heading quality is reliable, prefer a forward travel corridor
  over equally close places already behind the vehicle;
- **Region:** one slower-changing context card for the wider area, landscape,
  culture, or history rather than another list of administrative names.

Every normalized card carries a title, concise excerpt, distance/direction,
source and category, plus an image only when its source/licence metadata is
retained. Touch opens the richer A2 reader. `MAP` opens an explicit Google Maps
search URL and `QR` transfers the same destination to a passenger phone; without
a verified Place ID the UI says “Search in Google Maps”, never implying a
verified Google listing. While moving, there is no auto-opening carousel,
automatic route change, or long copy on the primary grid.

The v1 data path deliberately stays narrow:

1. Reuse ATLAS's session-only reliable position and heading; never persist exact
   coordinates or include them in diagnostics.
2. Extend the existing MediaWiki Geosearch/PageImages adapter to request page
   coordinates and normalize source, image and language metadata. Wikipedia and
   Wikimedia remain the only rich-content sources for v1.
3. Rank testably by forward relevance, distance, image/summary quality, category
   diversity and session novelty. Pure nearest-first order is insufficient.
4. Cache only bounded normalized metadata in coarse cells with a session TTL,
   abort stale requests, and prefetch one adjacent cell only while network state
   is healthy. Exact route history and application-owned image/audio caches are
   excluded.
5. Prefer current rendered map features for a regional label. Do not make the
   public Nominatim endpoint a production dependency; any later reverse-geocoder
   requires its own hosted/provider, privacy, attribution and rate-limit review.
6. Use truthful cached/offline/empty states. A sparse area may widen its bounded
   radius; a failed request must not fabricate places or silently retain a stale
   exact-position claim.

The implementation remains blocked on a new owner-assigned stable ID and the
mandatory exactly-three-direction visual gate. That gate must show DISCOVER at
`773 × 601`, its relationship to the collapsed ATLAS sidebar, card density,
reading handoff, source attribution, QR/Maps actions, loading/offline states, and
an image-free fallback. A2, A3b, X1/X2 and M13 provide shared dependencies but do
not silently absorb ownership of the new product surface.

### Visual library, appearance, and local conditions proposal — 2026-08-30

The current Visual picker is a flat six-row list. The registry itself is
already structured data, so the product can change selection grammar without
changing renderer ownership or fallback behavior.

**⭐ Preferred Visual Library structure:** replace rows with direct-selection
buttons in one scroll-safe surface and use visible section labels, not nested
tabs. The initial semantic split is `ROAD / PLACE` (VERTIGO, MERIDIAN, ATLAS,
DRIVEY) and `FIELD / ABSTRACT` (APERTURE, PRTCL). The future Gradient Field
joins the second group only after its three-direction gate. Categories are
discovery aids only: they never alter IDs, numbering, persistence, diagnostics,
or unlimited immediate switching. Each button must show active state and name;
real current-build imagery, renderer descriptions, and density are decisions for
the exactly-three-direction gate. Recent/favourite personalization is excluded
until the base grid proves that it needs another hierarchy.

`LIGHT`, `DARK`, and `AUTO` are an independent **interface appearance** setting,
not another Flux palette. The owner-selected Road Sheet is now the LIGHT source
of truth: warm ivory `#EEE9DE`, quiet control gray `#DCD7CE`, near-black type and
fields, vermilion state rails, hairline structure, and the shared `6 px` radius.
The earlier Model 3 manual sampling remains research evidence rather than the
product palette; its approximately `#F4F4F6`, `#DDDEE2`, and `#000000` regions
were image-derived observations, not Tesla-published design tokens.

The owner selected Space Grotesk for every live product, LAB, and diagnostic
text surface except exact textual `sedicivalvole` wordmarks. Those project-title
instances use restored Orbitron `750` with restrained `-0.02em` tracking; the
outlined Orbitron `16` in the reserved logo remains unchanged.
The running top bar deliberately uses that 16 Road mark without a textual
wordmark. Its `68 px` report-trigger cell exposes `195 px` at `773 × 601` and
`124 px` at `702 × 546` before the pinned telemetry module, reserving real room
for later X10 appearance or compact status controls without implementing them
prematurely.
The active visual palette continues to own the interface accent and remains an
optional versioned `localStorage` preference across reloads and later visits;
future `LIGHT`/`DARK`/`AUTO` appearance is stored independently. X2/X10 must keep
both choices immediately reversible and provide an explicit reset instead of
silently expiring preferences on reload.
The final claim of an exact target-vehicle match therefore requires a current
vehicle screenshot at native scale and a pixel comparison.

- the active environment and its ten authored palettes remain unchanged;
- Road Sheet anatomy remains invariant across appearances: product lockup,
  grouping, spacing, typography, control hierarchy, selection rail, and fixed
  action geometry do not move when the surface family changes;
- DARK maps the same anatomy to near-black, charcoal, dark-gray, warm-light,
  and vermilion tokens rather than introducing a separate layout language;
- shared chrome, dialogs, DISCOVER cards, DIAG, and the A2 reader receive paired
  high-contrast tokens rather than one-off component inversions;
- manual `LIGHT` or `DARK` persists as an explicit preference;
- `AUTO` first follows `prefers-color-scheme`; a real-Tesla gate toggles the
  native `Dark`/`Light`/`Auto` setting and proves whether the browser reflects
  it. If the signal is unavailable or static, reliable session-only position
  plus time determines solar day/twilight/night without a network request or
  stored coordinates;
- a hysteresis window around twilight and a no-mid-gesture rule prevent visible
  flicker or a sudden theme flip while the user is interacting;
- the light direction is warm and glare-bounded, never a pure-white full-screen
  sheet in the cabin. Contrast, image legibility, map attribution, focus states,
  reduced motion, and exact Tesla viewports remain acceptance gates.

Only the Road Sheet LIGHT launcher is visibly implemented in this checkpoint.
X10's pure model now owns the separate versioned preference/reset, safe storage
failure, browser-scheme priority, offline solar phase and twilight/interaction
holds at `[fe100b6]`. Product-wide DARK token application, the visible control,
system-signal capability adapter and position-to-AUTO wiring remain open; no
hidden automatic theme behavior is implied by the current launcher.

Tesla documentation now describes destination weather and, where equipped, a
map weather overlay with approximately three hours of precipitation animation.
A generic always-visible forecast would therefore duplicate the host vehicle and
consume scarce chrome. The queued weather feature instead becomes
**CONDITIONS**, a contextual and exception-led DISCOVER/ATLAS companion:

- stay absent when conditions are ordinary;
- surface concise changes that may alter a stop or discovery choice—rain/snow
  onset, strong gusts, sharp temperature change, poor visibility, or meaningful
  ultraviolet exposure—without presenting safety or route authority;
- allow an expanded, passenger-oriented six/twelve-hour strip and tomorrow
  summary, but never place the complete forecast permanently in the navbar;
- optionally re-rank DISCOVER categories (indoor culture during sustained rain,
  viewpoints/nature in clear conditions) while clearly separating weather data
  from editorial inference;
- request only a quantized coarse location, cache bounded forecast metadata for
  the session, disclose the provider, show observation/model time, and keep
  coordinates and forecast history out of diagnostics and persistence;
- fail silently into the normal product: weather never blocks ATLAS, DISCOVER,
  music, automatic appearance, or the active visual.

Open-Meteo is a plausible first source because its forecast API exposes hourly
conditions, sunrise/sunset, precipitation, temperature, wind, visibility and UV
for coordinates without requiring a client secret. It remains only a candidate
until current non-commercial terms, attribution, availability, model semantics,
request limits and coarse-coordinate behavior pass the same dated source-admission
review used elsewhere in this plan.

### Gradient-field reference proposal — 2026-08-30

The live ShaderGradient customizer and official source confirm that the effect is
a real-time 3D mesh system, not a rendered video or CSS gradient. A plane,
sphere, or water surface is displaced by time-varying coherent noise in the
vertex shader; the fragment shader mixes three colours from displaced position
and passes them through physical lighting/reflection; camera/object controls
frame the surface; optional visible grain adds a separate halftone post-process.
The full preset is serializable as React props or URL parameters.

The upstream repository and package declare MIT, but the current implementation
brings React Three Fiber, Three.js and related scene dependencies. The product
already has a direct-WebGL2 visual lifecycle, renderer diagnostics, context-loss
handling, and Tesla-specific fallbacks. **⭐ Preferred path:** keep the source as
a dated mechanics reference and first build an original one-pass WebGL2 spike;
admit the component only if a measured comparison proves that its appearance or
maintenance value outweighs bundle/GPU/runtime complexity. No upstream code,
package, shader, preset, environment map, or asset is admitted by this plan.

Two additional live references sharpen that recommendation. FeralUI Gradient
Builder is most useful as an authoring model: distinct visual families, named
palette roles, contrast feedback, perceptual colour profiles, and separate
motion/geometry/finish controls. Its terms explicitly leave unpublished demos,
including the inspected Gradient Builder, unlicensed for copying or
redistribution. ColorFlow is the closer runtime reference: a WebGL control mesh
with rectangular/circular topology, draggable points and handles, RGB/Lab/Lch/
OKLab interpolation, procedural point/handle/colour motion, independent pointer
interactions, and optional effects. Its free personal/commercial-use statement
does not provide an open-source licence for the editor, runtime, presets, embed,
or effect implementations. Neither new reference is admitted as source,
runtime, embed, export, preset, or asset.

The first spike therefore becomes a project-authored planar control mesh with a
small perceptually precomputed palette uploaded as uniforms or a tiny LUT. This
keeps colour-space conversion out of the per-pixel hot path, retains one render
pass, and tests the lightest useful interpretation first. A displaced/physically
lit direction remains one of the later visual candidates rather than the
baseline. Grain, blur, aberration, glass, halftone, and other post effects stay
off until an individually profiled option proves its value on Tesla.

The proposed view belongs in `FIELD / ABSTRACT` and consumes T1 rather than raw
GPS: sustained road energy drives bounded time rate and moderate deformation;
positive acceleration produces a brief bright/seam impulse; deceleration releases
asymmetrically without reversing or snapping; OPEN, UNDERWATER, and BLOOM use the
shared timestamped envelopes. Baseline rendering uses pixel density `1`, one
pass, restrained project-authored lighting, no HDR environment map, and no grain
post-pass. LAB owns later endpoint tuning and adaptive-quality evidence.

Implementation is blocked on a new owner-assigned stable ID and exactly three
owner-visible directions at `773 × 601`. The gate must compare visual identity,
rest state, 0/40/100/130 km/h response, all three macros, reduced motion,
non-WebGL fallback, one-pass versus optional grain, and measured Tesla frame
cost. The complete research and source-admission boundary are recorded in
`docs/REFERENCE-STUDY-SHADERGRADIENT.md` and
`docs/REFERENCE-STUDY-GRADIENT-TOOLS.md`.

### Real-Tesla diagnostic evidence — 2026-08-30

Two manually submitted, coordinate-free reports from build `20260830-0038`
cover approximately 13.7 minutes and 7.87 km of real driving at the exact
`773 × 601`, DPR `1.53` Tesla viewport. The private compressed reports remain
under `_references/diagnostics/`; only the following derived engineering facts
enter this plan.

| Evidence | Classification | Plan consequence and acceptance |
| --- | --- | --- |
| Both reports contain zero recorded runtime issues. GPS is live and numeric at roughly 10 Hz, with no null-speed samples, observed accuracy between about 1.6 and 3.3 m, and maxima of 89 and 106 km/h. | Verified field fact | Preserve this cadence/accuracy baseline in M13. No coordinates enter the report, storage or transmission; manual send remains the only telemetry boundary. |
| DRIVEY, APERTURE, MERIDIAN, PRTCL and PRIMORDIAL phase summaries remain approximately 59–60 FPS with bounded ordinary p95 frame times. | Verified field fact | Treat these as the current Tesla render baseline and detect regressions per phase rather than from one session-wide average. |
| Every measured ATLAS driving phase sustains only about 22.4–23.1 FPS against its declared 30 FPS target, with p95 intervals around 52–65 ms. | Verified performance defect | Add an ATLAS Tesla profiling gate: identify map repaint/camera/tile costs, then either reach a stable measured 30 FPS or explicitly revise the authored target with owner-visible evidence. The unrelated session pause must not be used to explain away the repeated per-phase result. |
| One visible-session pause contains a 12.741 s main-thread long task, a 13.5 s recorder gap and a GPS age near 13 s while ATLAS/JUNCTION remained selected. The report retains duration but not start time, active phase or attribution. | Verified symptom; cause unknown | M13 must retain long-task start time, phase, renderer and nearby state without coordinates. Reproduce before assigning the cause to MapLibre, audio decoding, the vehicle browser or another subsystem. |
| One JUNCTION request restored FRACTURE, while a later retry activated JUNCTION. The report ended with a healthy 24-clip bank but did not retain the failed request's reason. The cold bank is about 5.81 MB, the reported connection estimate was 1.5 Mbps, and the current transfer timeout is 12 s. | Verified fallback; network-timeout cause is a strong inference, not yet proof | Add a cold-cache constrained-network test for JUNCTION and NIGHTSHIFT. Selection must remain audible, expose the exact failure reason, retry automatically where safe, and eventually activate without requiring a second user selection. Test at 1.5 Mbps and at offline/warm-cache boundaries before changing timeout or bank format. |
| The first 240-entry event ring is dominated by 231 GPS samples and has lost early session interactions; the flight recorder retains state exposure but not every causal transition. | Verified diagnostic loss | Separate or aggregate high-rate GPS history so significant environment, score, failure, visibility and user-action events survive the full bounded session. Add a saturation test proving early significant events remain available. |
| The second run exercises all three JUNCTION take-pair identities and 17 rhythm-pair identities; decoded retention ends at six clips. | Verified positive field evidence | Preserve the six-clip bound and variety regression. This is reachability evidence, not perceptual approval of musical transitions. |
| ATLAS records no rendered frames during the first 22.8 s of the second run while GPS accuracy remains at the unavailable sentinel. The user switches away before valid fixes begin at about 34 s. | Expected waiting state, not a demonstrated renderer failure | Make `Atlas · waiting for GPS` explicit in phase diagnostics and UI evidence. A future report with a valid position but zero ATLAS frames is the failure condition. |
| Audio output latency is reported as `0 ms` in one run and `272 ms` in the other, while base latency remains about `42.7 ms`. | Field observation; support/meaning uncertain | Record availability and time history rather than presenting `0` as confirmed zero latency. Correlate repeated values with score timing and audible cabin behavior before opening an audio-sync defect. |

These reports do not close visual, comfort or listening acceptance: they prove
runtime behavior and expose reproducible engineering gates, but they contain no
human judgement about whether the music, motion or effects felt correct.

### What OPEN, UNDERWATER, and BLOOM mean today

- `OPEN` is an automatic hard-acceleration gesture. It currently requires at
  least `15 km/h` plus two eligible samples around `3 m/s²`; over `350 ms` it
  sweeps a score-derived focus band from about `480` to `3200 Hz`, adds air and
  a little width, then releases over one second. Its strict trigger explains why
  it can feel rare.
- `UNDERWATER` is the braking gesture. It engages only on deceleration stronger
  than ordinary regenerative lift-off, preserves transport, and sweeps two
  low-pass stages down toward `430 Hz` with resonance/saturation. The current
  level-preservation tuning can make the timbral change too polite on some
  arrangements even while the badge is correct.
- `BLOOM` is a very short launch accent: while OPEN is active, acceleration must
  cross roughly `1.5 → 4 m/s²` within `300 ms`. It lasts about `650 ms`, uses a
  swept delay/pitch gesture, and then has a `25 s` refractory period. That rare,
  short contract explains why its meaning is hard to learn from normal driving.

The target is now explicit: all three remain musical and clip-safe but become
unmistakable by ear and in the active visual. Trigger frequency, DSP difference,
peak/loudness, envelope timing and effect visibility must be measured separately
for FRACTURE, JUNCTION and NIGHTSHIFT rather than inferred from a generic test
fixture.

### Licensing recap and superseded recommendation

- AGPL applies to the project's covered **software and documentation**. It
  allows commercial use, forks and rebranding, while requiring covered source
  and notices; its network clause also covers modified network services.
- The repository's `LICENSE-SCOPE.md` expressly excludes original audio,
  screenshots, brand and standalone media unless a file says otherwise.
  Therefore AGPL does not automatically turn the project's recordings into
  freely reusable AGPL assets.
- Every third-party recording or visual keeps its own licence/permission.
  Neither AGPL nor a README credit can supply missing rights.
- Replacing AGPL with MIT or Apache would mainly make proprietary code forks
  easier. It would not make streamed audio uncopyable and would not improve the
  rights position of third-party, Jamendo, or Illobo material.

**Superseded on 2026-08-30:** the owner selected option B, so original
sedicivalvole material now uses `PolyForm-Noncommercial-1.0.0`. Public AGPL
versions keep their old rights; third-party licences and direct permissions
remain case by case; reserved audio/brand/media stay separate. This is a
practical project reading, not legal advice.

Primary-source checks used for this review:

- [GNU licence overview](https://www.gnu.org/licenses/) for AGPL's
  network-source purpose;
- [CodePen public-Pen licensing](https://blog.codepen.io/docs/pens/licensing/)
  for the current MIT default;
- [Strudel project integration guidance](https://strudel.cc/technical-manual/project-start/)
  for its AGPL/source-informed derivative boundary;
- [Jamendo API Terms of Use](https://devportal.jamendo.com/api_terms_of_use)
  for non-commercial API use, cache/offline restrictions, attribution, provider
  credit, and per-content direct-link requirements;
- [Jamendo tracks API](https://developer.jamendo.com/v3.0/tracks) for stream and
  download separation, download permission, track/artist/album metadata, image,
  licence, `shareurl`, audio format, pagination, and discovery fields;
- [MediaWiki Geosearch](https://www.mediawiki.org/wiki/API:Geosearch/en) and
  [PageImages](https://www.mediawiki.org/wiki/Extension:PageImages/en) for
  coordinate-based nearby discovery, page coordinates, and thumbnails;
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started)
  for a key-free external search/directions handoff rather than an embedded
  Google data dependency;
- [OpenStreetMap Foundation Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)
  for the public service's strict capacity, identification, caching, and
  attribution limits; the public endpoint is therefore not a default live
  reverse-geocoding dependency;
- [Tesla Model 3 Maps and Navigation](https://www.tesla.com/ownersmanual/model3/en_us/GUID-01F1A582-99D1-4933-B5FB-B2F0203FFE6F.html)
  for current destination-weather behavior; current market/configuration
  manuals also document an optional precipitation overlay, so a generic forecast
  is not sufficient product differentiation;
- [Tesla Model 3 Touchscreen](https://www.tesla.com/ownersmanual/model3/en_ie/GUID-518C51C1-E9AC-4A68-AE12-07F4FF8C881E.html)
  and its [current official Light illustration](https://www.tesla.com/ownersmanual/images/GUID-CA0C3D61-CB14-4EDA-86B4-E09274AAD173-online-en-US.png)
  for `Dark`/`Light`/`Auto`, ambient-light behavior, and provisional measured
  Light surfaces. Tesla publishes no design-token values in this evidence and
  explicitly warns that rendered details vary by software/market/configuration;
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs) for the candidate
  hourly variables, forecast window and sunrise/sunset capabilities; provider
  terms and attribution still require a dated admission gate before code;
- the repository's operative `LICENSE`, `LICENSE-SCOPE.md`, `NOTICE`,
  `THIRD_PARTY_NOTICES.md`, and `docs/LICENSING.md` for the actual local scope.

A previously considered metered generative source was checked against its public
API, pricing, and AI-product terms on 2026-08-30, then removed by owner decision.
Its credit economics and model-specific music restrictions did not establish a
safe playback grant for sedicivalvole. M5/M5b/M5c are closed and no private
account evidence or login is requested.

### Clarifications closed on 2026-08-30

- **S4:** option A selected; fresh sessions start sound/effects enabled and OFF
  is never persisted.
- **S2i:** option A selected; adaptive-score selection uses the existing
  immediate four-second crossfade and starts the selected score at phrase zero.
- **PP2:** superseded. The current PRIMORDIAL implementation is rejected and
  will be retired rather than refined or copied from the CodePen. `SF1` owns a
  new, original Gradient Field after exactly three directions are presented.
- **Licence strategy:** source-visible non-commercial is selected for original
  sedicivalvole material, subject to the Phase 0 file-level compatibility audit.
- **Traceability:** `A5`, `X9`, `X10`, `X11`, and `SF1` are approved.

S3's final name, the three UI/flow directions, backend host capability and the
three Gradient Field directions remain scheduled owner/technical gates rather
than missing requirements.


## Planning conventions

- Estimates are **half-days of engineering work**. Parent rows that summarise
  child rows are inclusive and must not be added to those child estimates.
- `Blocked` means a Q answer, external evidence, or visual selection is required.
- `Recorded` means the document made a decision that needs traceability but no
  implementation by itself.
- Every implementation checkpoint also updates the relevant tests and factual
  documentation. Product changes additionally follow the project changelog,
  commit, push, build-stamp, publication, canonical identity, cache, exact
  viewport, and real-Tesla validation rules.
- No source audio, private licence PDF, credential, `.env`, or `_references/`
  material enters Git or build output.

## Repository discoveries that change or complete the request document

1. **Viewport confirmed.** The compact Tesla browser viewport is genuinely
   `773 × 601` at measured DPR `1.53`; it is not an assumption copied from a mock.
2. **Current source identity.** The latest canonical checkpoint is published
   from source commit `229acc0` as build `20260830-1900`. Version remains
   `0.0.0`; the following documentation/test checkpoint records its evidence.
3. **Current catalogue is larger than the original document assumes.** Six
   visuals remain live in source (APERTURE, VERTIGO, MERIDIAN, ATLAS, DRIVEY,
   PRTCL) and three authored scores are ready (FRACTURE, JUNCTION, NIGHTSHIFT).
   PRIMORDIAL was rejected and removed on 2026-08-30.
4. **T1 mechanics are implemented and published.** The typed mapper owns endpoint
   clamping, curve exponent, asymmetric attack/release, hard per-second slew and
   frame-rate-independent scalar/vector state. Timestamped OPEN, UNDERWATER and
   BLOOM snapshots use the same audio envelope definitions. DRIVEY is the first
   visual consumer; the remaining PRTCL/ATLAS consumers stay assigned to X3.
5. **P2 is implemented and published.** PRTCL point scale runs from `0.82` to
   `1.48` over `0–100 km/h`, then holds that maximum above 100. Depth and travel
   still progress through the global `130 km/h` road ceiling. A dense
   `0→130→0` property check proves an identical reversible curve, bounded local
   increments and saturation; static captures cover all three families at
   `0/40/100/130`. T1 time-domain smoothing remains assigned to P1.
6. **Q2 is answered by code.** MURMURATION has one fixed camera profile with
   `zoom: 1.5`; there is no discrete speed-driven zoom ladder. The likely step is
   in shared instantaneous inputs or effect state, not discrete zoom levels.
7. **DRIVEY D1/D2 are implemented and published without vendor edits.** At commanded
   zero the external bridge projects the player to the current lane centre,
   aligns it to the road tangent and clears motion/steering state. It retains 16
   NPCs only when every generated car can be placed and verified opposite the
   player direction; ambiguous metadata fails closed to zero traffic and the old
   stored count preference is ignored.
8. **ATLAS now owns A1 and part of A3.** Touch and mouse camera exploration,
   hard-clamped `0–85°` pitch bounds, a six-second automatic return, compass
   control, and an ephemeral directional travel line pass tests. It still lacks
   the requested round pulsing point, street badge, cardinal-only compass, and
   embedded Wikipedia reader; physical endpoint feel and near-horizon vehicle
   acceptance remain open.
9. **A3 is not just smoothing.** The bounded eight-sample timestamped model now
   exists at `[b1897e4]`: it is frame-rate independent, does not extrapolate and
   freezes on stale or discontinuous data. `[c7c6647]` feeds every trusted fix
   into that session-only ref before any missing-speed return while keeping
   ordinary React camera state throttled. The travel line remains a separate
   representation; the visible round point remains gated.
10. **X1 has a useful base.** `DialogSurface` already supplies backdrop close,
    Escape close, focus trapping, focus restoration, and one-modal ownership.
    It can become the shared overlay primitive after the required three-direction
    visual gate; S5 needs a separate non-modal status surface.
11. **M13 was only partially present at audit time and its technical foundation is now published.** The
    current runtime adds `persisted()`/gesture-bound `persist()`, a versioned IndexedDB
    canary, separate significant/sample event channels, contextual long tasks,
    truthful output-latency history, bounded observed network counters, and at
    `[8aacaad]` a deterministic raw-report state that keeps browser connectivity
    hints separate from active app transfers, recent failures and recoveries.
    Navbar presentation, calendar-time canary and target-Tesla evidence remain open.
12. **The owner LAB is implemented and canonically published.** The
    selected Focus Canvas drives all three PRTCL families through 18 declared
    visual/context parameters and the shared typed protocol. Speed and manual
    audio level remain visual test signals; MUTE/FRACTURE/JUNCTION/NIGHTSHIFT are
    a separate disposable audio bench and never enter the preset. Import, copy,
    and authenticated email carry one complete coordinate-free visual preset.
    The unauthenticated gate and endpoint denial are
    verified. Authenticated canonical Browser QA now passes at the exact
    `773 × 601` CSS viewport with no overflow or console error; a preview macro
    overlap found there was corrected and published. A later lifecycle defect
    that rebuilt WebGL2 on every React update and eventually left a white canvas
    is fixed at `[8c37956]`: scene/type/control updates now preserve one renderer,
    and `ArrowUp`/release/`ArrowDown` reuse the production acceleration,
    regeneration and braking model. `[a40cfff]` adds complete-form speed scale,
    smooth OPEN/UNDERWATER/BLOOM morphs, production audio-macro input, real LAB
    audio/mute/meter behavior, and protected AudioWorklet packaging. Physical-Tesla use remains the open
    acceptance boundary.
13. **No passenger relay or proxy exists.** The Sites worker remains a static SPA
    fallback with only an asset binding. The verified canonical PHP boundary now
    covers diagnostic mail and the packaged owner LAB session/mail routes; this
    does not imply a future phone-control transport.
14. **G3/X5 is not resolved by rejecting Strudel.** Source, tests, CSS, and docs
    are already AGPL. Any client decryption scheme is corresponding source and
    cannot be treated as secret. This reopens the M4 architecture decision.
15. **The document's licence/API claims are imported context, not current proof.**
    Jamendo API behavior/quotas/URLs, Creative Commons treatment, Freesound,
    StreamBeats, and Strudel statements require fresh primary-source evidence
    before they become repository facts. The retired generative source was
    checked separately and then removed by owner decision.
16. **Current test baseline is environment-limited.** The per-machine native
    cache removes the shared-checkout arm64/x64 package conflict. The last full
    suite passes 340 of 341 checks, with only the PHP diagnostic-mail fixture
    unavailable locally because `php` is absent. After the renderer-lifecycle
    and audio/response correction, all 13 focused PRTCL checks and all 11
    focused LAB/control checks pass; both production builds complete
    successfully.
17. **Documentation drift was reconciled.** Active overview documents describe
    the 2026-08-30 PRIMORDIAL retirement and Phase 1 mechanics; immutable
    changelog and deployment evidence remain historical truth.
18. **The source document is external to Git.** `PIANO.md` carries full ID
    coverage, but the original Italian source-of-truth file itself is not
    versioned. Importing or translating it requires explicit approval.

## Phase map

Phases 0 and 1 are implemented, pushed and canonically published. Their
remaining acceptance work is explicitly target-Tesla observation, not missing
source implementation.

| Phase | Scope | Why this order | Checkpoint |
| --- | --- | --- | --- |
| 0 | M13 and baseline/toolchain gate | The storage canary needs calendar time; reliable tests are needed before product edits. | Canary appears in DIAG with age and truthful capabilities; focused and full baseline status is recorded. |
| 1 | T1, D1, D2; close D3 | Shared response mechanics must exist before scene tuning; DRIVEY zero hold is independently high-value. | Deterministic curve/envelope/slew tests pass; DRIVEY stays centred and motionless at zero, with opposing-only NPCs when reliable or no NPCs otherwise. |
| 2 | L5, L1–L4, X6 | The LAB must speak the future transport-independent protocol before scene-specific tuning. | The owner-only `/lab/` drives one scene through typed messages, exports a round-trippable preset, and can explicitly email that same complete preset from the authenticated session. |
| 3 | P1, P2, PF1, PF2, PM1, PA1, PA2 | These are shared-response consumers and require the LAB to set measured endpoints. | All three PRTCL families sweep smoothly through 0/40/100/130 and macro attack/release; retired PRIMORDIAL has no runtime consumer. |
| 4 | X1, X2; A1, A3, A3b, A4 | Screen zones and overlay grammar precede new ATLAS chrome and onboarding. | Selected three-direction layout passes `773 × 601`; map interaction, GPS states/help, five-second chrome, bounded palettes, point interpolation, road badge, and cardinal compass pass. |
| 5 | A2, S5, S4 | A2 becomes the first modal consumer; S5 is the shared non-modal feedback system; S4 supplies a universal state action. | Reader themes/type sizing and status feedback work with touch/keyboard; effect disable releases smoothly across all scores/visuals. |
| 6 | M0, M6, M7, M8, M11, Q16/Q17/Q18/Q22 evidence | Vocabulary, permissions, service architecture, and source admission must be true before catalogue code. The retired source is out of scope; M5/M5b/M5c require no work. | Primary-source evidence and private grants for admitted sources are archived; public docs contain no secrets and M11 decides every admitted source. |
| 7 | M1, M1b–M1e, M2, M3, M4, M9, M10 | Build PLAY THE ROAD/SOUNDTRACK only after licences, vocabulary, proxy, cache, and source-visible delivery reality are settled. | Seeded/offline metadata, streamed audio, attribution, two-mode selectors, onboarding, skip/shuffle, and cache refresh pass without shipping source audio. |
| 8 | S1, S3, then S2/S2a–S2j, X7 | Local musical macros precede remote control; the server is designed once for proxy plus relay. | Central display revokes immediately; up to four named phones sync complete state, respect grants, release on disconnect, and survive measured latency. |
| 9 | SF1 | The new Gradient Field cannot start without identity, per-reference licence boundaries, and a visual gate. | Exactly three original directions are shown; the selected result passes source/licence and viewport gates. |
| Deferred | G1–G8 | G7 rejects integration; G8 remains documentation/theory research only unless separately reopened. | No Strudel package/source enters the repository or an untracked study folder; any future language has a separately approved source-boundary brief. |

## Content-ID work ledger

### Shared response, DRIVEY, PRTCL, PRIMORDIAL, and LAB

| ID | Status and one-line work | Files | Half-days | Dependencies | Proposed acceptance | Main risk |
| --- | --- | --- | ---: | --- | --- | --- |
| T1 | Phase 1 mechanics implemented locally: typed scalar/vector response mapper with curve endpoints, asymmetric time constants, hard slew limits and timestamped shared audio macro envelopes. DRIVEY is the first visual consumer; PRTCL/ATLAS adoption remains in X3. | `src/response-mapping.js`, scene models/fields, `tests/response-mapping.test.mjs` | 3 | L5 contract for later LAB use | Scalar/vector endpoints, 30/60/120 FPS invariance, no overshoot, typed snapshots and shared BLOOM envelope tests pass. | One abstraction may erase scene character if it owns values rather than response mechanics. |
| D1 | Published and owner-accepted at the current product level: hold the upstream player car at zero velocity on the current lane centre, then resume without relocation. | `src/environments/drivey/drivey-field.jsx`, `drivey-model.js`, `tests/drivey-model.test.mjs`, QA harness | 1.5 | T1 commanded transition | A 600-frame zero hold has no drift; resume does not reposition; Hood/Rear/Aerial load at `773 × 601` with no browser errors. Real-Tesla motion observation remains open. | Target-browser physics timing still needs vehicle evidence. |
| D2 | Published and owner-accepted at the current product level: retain 16 NPCs only when every car is deterministically placed and verified opposite the player direction; otherwise fail closed to zero and ignore the retired count preference. | `drivey-model.js`, `drivey-field.jsx`, `App.jsx`, Drivey tests/docs | 1 | Lane-direction feasibility audit | Deterministic direction and zero-fallback tests pass; browser QA is clean. Real-Tesla traffic observation remains open. | Generated-road metadata may differ under target-session timing. |
| D3 | Resolved with no additional product behavior: D1's road-centred, motionless player at zero is the complete requirement. | `PIANO.md`; D1 tests | 0 | None | D1 acceptance fully covers the owner's zero-speed request. | None beyond D1. |
| D4 | Deferred nice to have: raise the Aerial camera smoothly as speed increases, using project-owned bridge state only. | `drivey-model.js`, `drivey-field.jsx`, Drivey tests/QA | 0.5 | T1; future owner review | Camera height is bounded and monotonic at 0/40/100/130 km/h, smooth and reversible at 30/60/120 FPS; Hood/Rear, zero hold, traffic and all 51 vendor hashes remain unchanged. | Excess height may make the road or opposing traffic unreadable; FOV substitution could distort the accepted composition. |
| P1 | Planned: route every PRTCL scale/depth response through T1. | `prtcl-model.js`, `prtcl-field.jsx`, `prtcl-renderer.js`, PRTCL tests | 1 | T1 | Abrupt input and macro sequences have continuous bounded output at 30/60/120 FPS. | GPU uniforms currently receive raw profile output every frame. |
| P2 | Implemented and canonically published: point scale is minimum at 0, reaches its maximum at 100, saturates above 100 and leaves depth/travel on the 130 km/h product ceiling. Engineering acceptance passes; physical-Tesla/owner perceptual acceptance remains. | Same PRTCL files plus LAB preset schema | 1 | T1 | Dense 0→130→0 sweep proves equal curve shape up/down, bounded local progression and saturation; 0/40/100/130 captures show every family. | Static engineering captures do not replace target-vehicle perception. |
| PF1 | Static calibration ready for owner review: Fractal shows an identity-preserving 0/40/100/130 scale/depth progression through P2. Any additional rest-state camera reduction remains a perceptual decision. | `prtcl-model.js`, `prtcl-renderer.js`, LAB config, tests | 0.5 | P2, LAB | Captures at 0/40/100 show continuous identity-preserving scale progression. | “More zoomed out” is perceptual and needs owner approval. |
| PF2 | Owner-approved: feed OPEN/UNDERWATER/BLOOM envelope values, not discrete effect names, into every PRTCL family and make each gesture visually unmistakable. | T1 module, `prtcl-model.js`, renderer uniforms, tests | 1 | T1 | Macro onset/release matches shared envelope samples across all PRTCL types; exact-viewport capture distinguishes all three at a glance. | Audio and visual clocks may disagree without timestamped snapshots. |
| PM1 | Static calibration ready for owner review: Murmuration uses its fixed camera and the shared P2 scale curve without a fabricated discrete ladder. T1 smoothing and any stronger perceptual rest/progression tuning remain open. | `prtcl-renderer.js`, `prtcl-model.js`, LAB/tests | 0.5 | T1, P2; Q2 resolved by code | Smooth sweep and owner-approved smaller rest state; no frame-to-frame discontinuity. | Symptom may originate in source particle motion rather than camera scale. |
| PA1 | Static calibration ready for owner review: Axiom uses the shared P2 curve and visibly progresses at 0/40/100/130. T1 smoothing and owner perceptual approval remain open. | PRTCL model/renderer/LAB/tests | 0.5 | T1, P2 | Same property tests and exact-viewport sweep as Fractal/Murmuration. | Axiom has terrain and agents with different perceptual scales. |
| PA2 | Planned: separate rain density, fall speed, and wave amplitude as LAB parameters, driven by one live speed curve. | `prtcl-model.js`, `prtcl-renderer.js`, LAB schema/UI, tests | 2 | T1, L1–L5 | LAB controls each axis independently; live preset maps 0–100 monotonically; 0/40/100 captures approved. | Current “agents” are not yet a semantically explicit rain system. |
| PP1 | Retired by owner on 2026-08-30: do not tune or extend the current PRIMORDIAL field. | Registry, preferences, App/render path, tests/docs | 0.5 | None | PRIMORDIAL cannot be selected; persisted `primordial` migrates to Aperture; no orphan chunk/control remains in the production build. | Removing history instead of only runtime would damage provenance. |
| PP2 | Superseded by `SF1`. The CodePen remains credited as a historical visual reference, but no exact-copy or clean-room fidelity work continues. | Notices, source-admission docs, history | Included in SF1 | None | Active docs distinguish retired PRIMORDIAL from the new original Gradient Field; no Pen shader/runtime/noise enters SF1. | Accidentally treating visual inspiration as a source licence. |
| SF1 | Owner-approved new Gradient Field: exactly three original WebGL/3D directions using independently authored gradient, depth and perceptual-colour mechanics. | New field/model/renderer only after visual selection; reference and licence docs; tests | 3+ | Three-direction owner gate, T1, LAB | Selected direction is original, one-pass/pixel-density-1 by default, smooth at 0/40/100/130, visibly macro-responsive and Tesla-profiled; all references remain case-by-case notices. | Excess 3D/postprocessing cost or accidental source/preset copying. |
| L1 | Implemented and canonically published; authenticated desktop and simulated exact-Tesla-viewport acceptance pass, while physical-vehicle acceptance remains pending. The owner-only `/lab/` uses server-side authentication with an expiring PHP session and ignored password-hash configuration; no password or authentication decision exists in client JavaScript or static assets. | `lab.html`, `src/lab/`, `/lab/` PHP gate/session/logout, ignored local auth config, deployment and access tests | 3 | L5, T1; verified canonical PHP/TLS boundary | Local development works without weakening the production gate; unauthenticated canonical access reveals only the login surface, authenticated access reaches LAB at `773 × 601` without overflow or console error, logout/expiry revoke access, direct asset/API requests cannot bypass the gate, and no secret enters Git/build/logs. | A merely hidden URL or client-side password would expose controls and secrets; long-lived Tesla sessions need deliberate expiry/re-auth behavior. |
| L2 | First manifest implemented for all three PRTCL families: independent speed/BPM, music, visual, complete declared scene-specific controls, and keyboard motion using the shared Tesla acceleration/regeneration/braking model. The WebGL2 field keeps one renderer alive while values and family change. Expansion to every active visual remains incremental. | LAB UI/schema plus declared per-scene parameter manifests | 3 | L1, T1 | Every admitted visual is selectable and its declared parameters change without reloading or recreating the WebGL context; keyboard motion ignores interactive control focus. | An unbounded “everything” panel becomes unusable. |
| L3 | Implemented for the first manifest: shared Form/Response/Macros/Scene groups render from declarations in the selected Focus Canvas. | LAB components/schema/tests | 1 | L2 | Every admitted scene uses the same group order and no flat orphan control exists. | Scene-specific semantics may be forced into misleading generic labels. |
| L4 | Implemented locally for the first 20-option manifest: export/import schema version, UTC date, scene identity, app/build/commit identity, viewport/runtime context, selected Visual/Music/theme/input, speed/BPM, grouped and scene-specific values, render health, and protocol revision. `COPY JSON` and explicit authenticated `SEND JSON` use the identical validated preset. Coordinates, secrets, raw credentials, storage contents, and unrelated browsing/device traffic are forbidden. | LAB preset/context module and UI, authenticated `/lab/` mail endpoint, ignored recipient config, schema/security/round-trip tests | 2 | Q30, L1–L3 | Exact JSON round-trip; unknown-major rejection; visible copy/send/sent/retry states; mail attachment digest matches the exported JSON; CSRF, origin, size, schema and rate-limit checks pass; failed sends retain the preset locally for retry and never claim inbox delivery. | Clipboard limitations in embedded browsers, mail transport acceptance without inbox delivery, context bloat, or accidental sensitive telemetry. |
| L5 | Implemented as `sedicivalvole.control.v1`: transport-neutral typed `param`, `command`, and `state` messages with manifest admission, ordering and bounded payloads. | `src/control-protocol.js`, tests, LAB adapter, later relay adapter | 2 | None | Versioned schema rejects malformed/unauthorised messages; ordering and idempotency tests pass. | Over-designing distributed behavior before local needs are known. |

### ATLAS and shared interface surfaces

| ID | Status and one-line work | Files | Half-days | Dependencies | Proposed acceptance | Main risk |
| --- | --- | --- | ---: | --- | --- | --- |
| A1 | Implemented locally at `[8feb142]`: the manual camera is hard-clamped to `0–85°`, MapLibre receives the same bounds, and the exact six-second return is preserved. Physical endpoint feel remains an owner/vehicle acceptance item. | `atlas-model.js`, `atlas-field.jsx`, `atlas-model.test.mjs`, CSS/QA | 1.5 | Exact-scene owner review | Model and runtime share exact endpoints and clamps; one fresh automatic return begins 6000 ms after the latest interaction with no repeated ownership fight. | Near-horizon MapLibre cost and building occlusion. |
| A2 | Owner-approved after visual gate: add Read more and an in-motion partial-page Wikipedia reader with shared modal behavior, small-A/large-A sizing and warm-light/dark themes. | ATLAS field, `App.jsx` shared overlay, `styles.css`, tests/notices | 2.5 | X1/X2, selected direction | X/backdrop/Escape/focus/scroll work; text sizing and themes persist accessibly; approved size/opacity at 773×601. | Wikipedia frame policy/network failure and driver distraction. |
| A3 | Feed/model foundation implemented locally at `[b1897e4]` + `[c7c6647]`: trusted coordinates reach an eight-sample session-only ref at GPS cadence even when numeric speed is null; a `100 ms` delayed 30/60 FPS invariant interpolator handles cyclic longitude/heading, never extrapolates, freezes after `1500 ms` and does not animate across gaps above `750 ms`. React camera position stays at `2500 ms`; MapLibre source/layer and the selected round-point treatment remain open. | `atlas-model.js`, `atlas-field.jsx`, tests | 2 | T1 concept, GPS timestamp data, selected overlay direction | 10 Hz synthetic fixes produce smooth 60/30 FPS point motion; stale/invalid fixes freeze honestly; no coordinates in DIAG/storage; rendered point passes the selected direction. | Interpolating across bad fixes can visibly cut corners. |
| A3b | Model foundation implemented locally at `[4a4e191]`: derive a bounded local road name only from already rendered transportation features, with language/ref fallbacks and no network path. `queryRenderedFeatures` wiring and selected badge placement remain open. | ATLAS model/field, CSS, tests | 1 | Q28, X2 | Badge never overlaps compass; no extra network call; absent/multilingual names degrade cleanly. | Tile feature schemas vary by zoom and road class. |
| A4 | Model foundation implemented locally at `[4a4e191]`: normalized heading maps deterministically to English N/NE/E/SE/S/SW/W/NW including exact wraparound. Replacing degree text and selected compass placement remain open. | `atlas-model.js`, field, tests/CSS | 0.5 | X2 | Eight deterministic sectors including wraparound; no numeric degrees in visible UI. | Compact labels still need exact-viewport and cabin-distance acceptance. |
| X1 | Planned: define one modal manager/primitive plus one non-modal status layer for A2/S1/M2/S5 and GPS help. | `App.jsx` component extraction, `styles.css`, accessibility tests | 2 | three-direction gate | Only one modal owns focus; replacement/close rules are deterministic; status feedback never blocks. | Treating transient feedback as a modal would violate S5. |
| X2 | Partially selected and implemented: the launcher sub-gate chose **Instrument Deck** and now resolves `MUSIC` + `VISUAL` + `START` at `773 × 601`. The running top bar now uses a fixed `68 px` logo-only report trigger, exposing a measured `195 px` / `124 px` lane at `773 × 601` / `702 × 546` before pinned telemetry. The remaining exactly-three-direction gate still covers compass, road badge, GPS truth/help/metrics, compact network activity/problem/recovery notice, closed-by-default rich credit, participant count, passenger/modal area, status, how that free lane hosts appearance/status controls, five-second chrome, bounded right-aligned fullscreen palettes, grouped direct-button Visual Library, `LIGHT`/`DARK`/`AUTO` appearance access, one-time onboarding, the 64 px footer, and a landscape-first iPhone presentation with an inert portrait rotation notice. | Design evidence doc and later CSS/App/ATLAS | 3 | remaining visual gate | The implemented launch cannot enter until Music and Visual are explicitly resolved, including a Visual alongside MUTE; remaining owner selection verifies real icons and hierarchy, one-tap Visual access, quiet healthy network state, clear degraded/offline state, source-correct closed credit, five-second chrome retirement, bounded palette width, non-invasive appearance, and sub-four-second reduced-motion-safe onboarding. Every visible framed surface uses the shared `6 px` radius. Phone QA covers `667 × 375`, `844 × 390` or `852 × 393`, and `932 × 430`, their portrait counterparts, safe-area insets, and live portrait-to-landscape rotation without reload or session restart. | Scope density can obscure the driving field, map attribution, music credit, or the difference between interface appearance and visual palette; an over-broad orientation query could also block Tesla or desktop windows. |

### Audio controls, SOUNDTRACK, licensing, and server work

| ID | Status and one-line work | Files | Half-days | Dependencies | Proposed acceptance | Main risk |
| --- | --- | --- | ---: | --- | --- | --- |
| S1 | Expanded, owner-approved: make automatic OPEN/UNDERWATER/BLOOM unmistakable in every authored score and visual; design always-available in-motion musical macros that cover flanger, reverb, chorus and beat-repeat characters without exposing raw DSP. | `audio-engine.js`, score DSP/worklet, scene mappings, `App.jsx`, protocol, tests, MUSIC-CRAFT | 5 | L5, X1/X2, M11 source capabilities | Per-score fixtures measure trigger reachability, spectral/DSP difference, level, peak and release; exact-viewport plus headphone/cabin review proves every automatic effect and selected manual macro is obvious, fun and safe. | Strong processing can damage authored harmony/dynamics or violate derivative restrictions. |
| S2 | Planned parent: passenger phone controller over the shared relay/protocol. | New passenger client, relay service, App session UI, protocol/tests/docs | 8 | S1, M1, L5, S2a–S2j, X7 | End-to-end session, grants, reconnect, conflict, latency, expiry, and release tests pass. | First persistent server dependency and mobile-network variability. |
| S2a | Recorded decision: WebSocket relay, no local in-car server. | Server architecture doc, relay implementation/tests | Included in S2 | X7 | Car and phone join only through expiring room credentials; no browser listen socket. | Hosting platform may not support stateful WebSockets. |
| S2b | Recorded decision: phone is remote only; audio remains in car; one session token generation at a time. | Protocol/session model, phone UI, tests | Included | S2a | No phone audio graph; generating a QR invalidates the previous token. | Browser audio accidentally duplicated through preview/media elements. |
| S2c | Recorded decision: passenger may control granted macros, track/library, score, and visual. | Permission model, car/phone UI, protocol tests | 1.5 | S2d, S2i, S2j | Default grants are visible and each category can be toggled in one car tap. | “Everything” without clear grouping becomes unsafe and confusing. |
| S2d | Expanded mandatory rule: central display is authority, shows participant count/two-word aliases, and can revoke one or all immediately; continuous last-write wins and discrete changes identify peer actor. | Session reducer, car UI/status, tests | 2 | S2c, S5 | Revocation beats queued commands; count and actor update live; alias generation is non-offensive and collision-safe within the room. | Network ordering, stale commands and unsuitable generated aliases. |
| S2e | Owner-resolved lifecycle: the room persists until the car session is destroyed, not until phone inactivity; phone close/reopen may resume; car/off, explicit revoke or room regeneration invalidates access and releases continuous controls neutrally. | Relay/session state, macro envelopes, phone/car clients, tests | 2 | T1/S1, reliable car-session lifecycle | A phone reconnects after 20+ minutes while the car room lives; revoke/off/regenerate invalidates immediately; discrete state stays. | Detecting “vehicle off” reliably from a browser lifecycle event. |
| S2f | Expanded optimistic phone UI with authoritative live snapshots/revisions on all devices. | Phone state model/UI/tests | 1 | S2a, L5 state sync | Sliders render immediately; every phone receives current knobs, score, track, visual and grants on join/change/reconnect; rejected optimism reconciles clearly. | High-frequency state echo and snap-back under conflicts. |
| S2g | Owner-resolved: maximum four equal-control passenger devices; fifth join is rejected, while car UI shows count and identity. | Relay capacity/session tests, phone join and car participant UI | 1 | S2d/S2f | Four devices remain live and synchronised; deterministic fifth-device rejection does not disturb them. | Abuse/resource exhaustion. |
| S2h | Recorded dependency row: S1, shared server/M6, and S2a must be complete first. | `PIANO.md` tracking only | 0 | S1, M6, S2a | Phase cannot move to active until dependencies are green. | Parallel implementation could bypass the gate. |
| S2i | SOUNDTRACK half resolved: normal-track skip uses an owner-approved 450 ms equal-power crossfade. Adaptive PLAY THE ROAD handoff still awaits clarification 2. | Audio engine/crossfade, protocol, App/phone UI, tests | 2.5 | clarification 2, M1/M2 | 450 ms track skip has no click/silence/stale metadata; adaptive behavior follows the confirmed immediate-or-boundary contract with visible state. | Current score switching is an immediate four-second crossfade, so boundary-aware handoff is architectural. |
| S2j | Recorded decision: visual switching is immediate/unlimited and reuses existing transition, with no rate limit. | Protocol command handler, App environment selection, tests | 0.5 | L5, S2d | Repeated commands stay responsive, latest wins, and current fallback/error boundary remains intact. | Heavy lazy loads under rapid scene switching. |
| S3 | Visual-selection gate: `PATCH` is rejected; present exactly three exciting, unambiguous name/icon systems derived from COPLAY, TUNE THE ROAD and COPILOT DJ. | Design evidence, then App/phone copy, protocol/docs/tests | 0.5 | X2 selection | One approved name and multi-user icon everywhere; legacy/internal alias migration tested if needed. | A clever name may still fail to communicate multi-user control. |
| S4 | Planned under recorded interpretation: universal effects master beside Mute, always present and enabled on every fresh session, with disabled state not persisted; release active macros normally. | `App.jsx`, `audio-engine.js`, fields via active envelope, CSS/tests/diagnostics | 2 | clarification 1 only if interpretation is wrong; T1/S5 | All score paths retain dry music; reload starts enabled; disable/re-enable is click-free and visibly confirmed in the central status layer. | Source capability policy must not be conflated with user master state. |
| S5 | Expanded: large, brief, shared non-blocking feedback for automatic effects, mute/effects state, mood and later commands. | `App.jsx` status component, CSS, accessibility/timer tests | 1.5 | X1/X2 | Effect name gains clearly larger type/background during its envelope; consistent location, auto-dismiss/release behavior, deterministic replacement, no focus capture. | Feedback can obscure road/ATLAS information at 773×601. |
| M0 | Planned vocabulary migration: use only SOUNDTRACK/score/source/selection semantics for the music product. | Score registry, App/protocol/server code, docs/tests | 1.5 | M1 architecture | Product-semantic scan passes without renaming unrelated geometric concepts. | Blind global replacements would corrupt Meridian and historical/legal quotations. |
| M1 | Owner-corrected architecture: two primary music blocks—PLAY THE ROAD containing FRACTURE/JUNCTION/NIGHTSHIFT, and SOUNDTRACK containing fixed recordings browsed by genre and source-supported pace metadata. | `score/genres.js` refactor, App controls, audio engine, protocol/tests/docs | 4 | M0, M6/M8/M9 | Both blocks and all three authored scores remain reachable; only SOUNDTRACK exposes a recording catalog; active mode/source is always explicit. | A second hierarchy can become too deep at 773×601. |
| M1b | Recorded labels: primary blocks are PLAY THE ROAD and SOUNDTRACK; launch helper copy explains the difference. | Same registry/UI/docs | Included in M1 | X2 onboarding selection | Exact English labels and concise meaning appear consistently without reviving obsolete service terminology. | Product copy can over-explain the launch surface. |
| M1c | Recorded mapping: PLAY THE ROAD music/effects may adapt to driving; SOUNDTRACK recordings never change tempo/selection mid-track from speed, while separately permitted vehicle/manual effects may process them. | Audio routing, score/source metadata, tests | 1 | M1, S4, X8 | Speed cannot re-time or replace the active SOUNDTRACK item; capability flags gate every effect bus. | Applying effects to ND or source-restricted tracks. |
| M1d | Planned: use source genre/pace metadata for browsing and next-track selection only, never mid-track switching. | Catalog selector, protocol/state, tests | 1.5 | M9, Q23 | Driving-band changes affect the next choice only; deterministic seeded tests cover all bands. | Source metadata quality and semantics may be inconsistent. |
| M1e | Planned: five plain-language driving rhythm bands with automatic/manual modes. | SOUNDTRACK UI/schema/catalog query/tests | 1.5 | Q23, M1d | Every band has visible explanatory copy; manual override and restore-auto are unambiguous. | Italian labels in the request must become approved English product copy. |
| M2 | Partially implemented locally: the owner-selected **Instrument Deck** follows the Signal Gate with `MUSIC`, `VISUAL`, concise descriptions, and one final `START`; it resolves PLAY THE ROAD or MUTE plus the initial Visual before starting, while SOUNDTRACK remains visibly unavailable until its real player exists. Skip, shuffle, title/artist, compact rich credit, SOUNDTRACK activation, and selected one-time control onboarding remain planned. | App shared overlay/status, audio controller, Visual registry, CSS/tests | 3.5 | M1, M10, X1/X2/X9, S2i | Exact `773 × 601` Browser QA proves START disabled before both choices, MUTE + PRTCL enable it, and the app enters PRTCL muted; every launcher surface computes to the shared `6 px` radius. Later attribution follows the audible track through rapid skip without stale metadata; onboarding completes under four seconds and respects reduced motion. | Mandatory attribution and two-axis onboarding can overload the launch flow. |
| M3 | Owner-authorised: prominent Illobo featured selection inside the SOUNDTRACK library, complete per-file provenance, and QR/link to `https://soundcloud.com/illobo`; private written confirmation recommended. The selected featured treatment is `Signal Border`: one restrained moving red segment around the Illobo library choice, static under reduced motion, without a decorative badge. | Catalog seed/source adapter, UI/notices/tests | 1.5 | M11, owner-supplied/approved file inventory | Only owner-authorised works appear; each carries source/licence capability flags; QR/link is tested and Signal Border is noticeable inside SOUNDTRACK without changing the top-level launcher hierarchy. | Platform download status is not a substitute for the direct grant or provenance. |
| M4 | Owner-approved source-visible delivery: no client-secret/protection claim; protected local sources use server-authorised short-lived segmented delivery, never Git audio, with harmless public sample configuration only. | Server delivery, client Media Source/blob path, `.gitignore`, sample config, docs/tests | 3 | source-specific grants, M6 | No source audio/credential/private host data in Git/static build/logs; expiring authorisation and segmented playback; docs call it delivery control, not protection. | Browser users can always capture decoded audio; network dependence in car. |
| M5 | Closed by owner: the retired external source is excluded from product, catalogue, authoring, local audition, and runtime. No API calls, keys, credits, or files are used. | `PIANO.md` decision record only | 0 | Future explicit owner reopening | Repository and runtime contain no dependency, asset, key, request, or product claim for the retired source. | A future proposal could accidentally revive the source without rechecking current model-specific terms. |
| M5b | Closed/superseded: no audiovisual-only exception for the retired source is retained. | `PIANO.md` decision record only | 0 | M5 future reopening | The source cannot appear in any browsing, selection, playback, effect, or authoring path. | Treating a plan-tier marketing label as a sufficient music grant. |
| M5c | Closed: the private PDF-download action and persistent reminder are cancelled while the source remains excluded. | `PIANO.md` decision record only | 0 | None | No account login or evidence reminder appears in work reports; `_references/` material remains untouched. | None while the source stays excluded. |
| M6 | Planned source/server strategy: first audit the offered host beyond FTP, then deploy one minimal service for API proxy, catalogue refresh, delivery authorisation, and later relay on a purpose-specific subdomain such as `api.sedicivalvole.app`. | New server project/location after host decision, client adapters, tests/docs | 4 | X7, source verification, host capability evidence | TLS, runtime/process lifecycle, WebSocket, secret storage, logging and deploy/rollback are evidenced; credentials never reach browser/logs; offline catalogue and honest failure pass. | FTP-only hosting may not support a persistent relay or secure secret boundary. |
| M7 | Owner-resolved contact: add an English music/licensing/removal policy and complete source inventory using the public repository's GitHub Issues route, not public email. | `README.md`, `docs/LICENSING.md`, `NOTICE`, `THIRD_PARTY_NOTICES.md` | 1.5 | M11 evidence | Public GitHub destination works; VERTIGO/Tympanus and every admitted/referenced source reconcile across documents; no private evidence or overclaim. | “Remove on request” does not substitute for permission. |
| M8 | Partially verified research ledger: current public Jamendo API terms permit non-commercial API use, require member/provider credit and a direct content-page backlink, and prohibit apps designed for content caching or offline access; track docs expose the required metadata and download-permission distinction. The prepared live API access passed a secret-safe operational check on 2026-08-30: API status success, three distinct tracks/artists, required metadata present, and a minimal range stream returning `206 audio/mpeg`. Continue re-verifying track-level Creative Commons capabilities, Freesound, FMA and SoundCloud; StreamBeats remains permanently rejected. | `docs/SOURCE-ADMISSION-*`, `THIRD_PARTY_NOTICES.md` only after admission | 1.5 | Q17/Q18 | Dated source URLs, exact terms/API facts and M11 answers; no Jamendo offline-audio cache or unapproved download; StreamBeats has no code/UI/outreach. Operational success must not bypass per-track capability admission. | The API terms date from 2013 and may drift; individual track licences still govern each use. |
| M9 | Owner-selected first SOUNDTRACK integration: audit the prepared Jamendo read API access, then build a proxy-populated, short-lived metadata cache and three transient browser-media slots: previous/current/next. Refill next after consumption, exclude current/recent tracks, prefer a different recent artist when alternatives exist, validate metadata before playback, and release the displaced media element. Use the stream `audio` URL with browser-native `preload=auto`; never fetch complete application-owned blobs or retain audio in Cache Storage, IndexedDB, a service worker, or download files. | Server adapter, `src/soundtrack/catalog-store.js`, IndexedDB metadata module, three-deck media controller, tests | 4 | M6, M8, M13, Q16/Q22 | Client ID never reaches Git/browser/logs; OAuth secret/redirect remain unused; stale/removed metadata cannot start playback; previous/current/next identities stay coherent through rapid back/forward; no immediate newly selected repeat; recent memory produces broad deterministic rotation; buffer depth is reported rather than promised; exhausted buffer pauses/retries SOUNDTRACK without changing mode and resumes cleanly on recovery. | Stream URL expiry, `preload` being only a browser hint, accidental persistent audio storage, memory pressure, and repeated artists in a narrow filtered pool. |
| M10 | Planned source-aware visible attribution and Music & Licences settings page. A compact closed-by-default navbar/corner credit control opens a polished card with API-provided cover `image`, track `name`, `artist_name`, optional `album_name`, licence link, textual `Provided by Jamendo`, and a direct touch link plus QR encoded from the current `shareurl`; an artist destination may be added only from a verified API field/query. | Track state/UI, settings surface, catalogue schema, QR component, tests/notices | 2.5 | M1/M9, X1/X2 | No persistent driving clutter; card always matches the audible track; singles fall back cleanly without album fields; touch and QR reach the exact source page; artist/title and provider credit satisfy the API terms; cover failure has a restrained text fallback; no unapproved logo or implied endorsement. | Stale attribution during crossfade, hidden credit becoming undiscoverable, and treating a QR alone as the required direct backlink. |
| M11 | Implemented foundation, not yet connected to production: in-app selection, source streaming, audio effects, and hosted-copy answers are independent `allow`/`deny`/`unknown` capabilities. Jamendo normalization preserves licence obligations and required credit/link fields while discarding download data; ND and unknown records fail closed. Direct grants require explicit decisions for all four capabilities and a stable evidence reference. | `src/soundtrack/source-policy.js`, focused tests, `docs/SOUNDTRACK-SOURCE-POLICY.md`, licensing log | 1 | Fresh primary evidence checked 2026-08-30 | Six focused checks prove unknown/ND exclusion, obligation preservation, complete credit/source URLs, no retained download field, and explicit direct-grant decisions; production integration must consume this gate before playback/effects. | Typed decisions cannot replace source-specific evidence or future terms rechecks. |
| M13 | Technical foundation implemented through `[8aacaad]`: persistent-storage probe and long-lived IndexedDB canary; vehicle software only when explicitly supported; coordinate-free GPS cadence/accuracy; separate significant/sample event retention; contextual long tasks; truthful output latency; bounded session network totals/rates/peaks plus active download/upload, failure, recovery and conservative notice classification. X2 still owns visible navbar treatment. | Storage/network probe modules, `App.jsx`, diagnostics model/UI/tests/docs | 4 | calendar-time and target-vehicle evidence, X2 presentation | Canary identity survives reload; no coordinates are retained; 240+ GPS samples cannot evict early significant events; a synthetic long task reports start/phase/renderer; unavailable latency is truthful; REPORT separates browser-estimated connection state from observed app download/upload bytes, rolling rates, peaks, active transfers, errors, and recovery. Cross-origin/cache opacity is explicit and all counters are session-bounded. | Persistence needs elapsed time; added observability must stay bounded, avoid false precision, and must not collect sensitive location or unrelated device-network data. |

#### Illobo source-preparation note — 2026-08-30

- The owner-supplied intake directory is
  `_references/audio/tracks/illobo/original/`. It originally contained 38 WAV
  files totalling approximately 2.5 GB: 30 unique byte identities and eight exact
  `(1)` copies. On 2026-08-30, the owner approved removing all eight verified
  duplicates and the 37:51 long-form mix. They were moved to the recoverable
  system Trash. The active ignored archive now contains exactly 29 unique WAV
  masters totalling approximately 1.5 GB.
- Preserve every original file unchanged. Admission creates a per-file manifest
  with original filename, SHA-256, duration, sample rate, bit depth, selected
  editorial title, output filename, encoded hash, encoder/version/settings,
  direct-grant capability flags and the public Illobo destination
  `https://soundcloud.com/illobo`.
- Selected web master: stereo MP3 through deterministic `libmp3lame` VBR `V2`
  (`-q:a 2`), preserving the source sample rate and programme dynamics, with no
  loudness normalization, remastering, clipping repair or destructive source
  rewrite. The 5–10 MB request is a normal-song target, not permission to lower
  long material until it sounds damaged; every exception is measured and listed.
  MP3 is preferred here because one playback file works across the supported
  Tesla/Chromium, Safari and desktop surfaces without a parallel fallback set.
- The ignored conversion pass is complete at
  `_references/audio/tracks/illobo/web/`, with full technical provenance in
  `_references/audio/tracks/illobo/web-manifest.json`: 29 immutable WAV masters
  became 29 unique, fully decodable MP3 files; 1,643,181,158 source bytes became
  195,753,212 output bytes (88.087% reduction), with a 6.65 MB median and a
  3.82–12.07 MB range. Source SHA-256 identities, sample rates and durations were
  preserved; the maximum measured duration delta is `0.0 s`. Only `Floating
  Stars` (12.07 MB / 8:04) and `Sliced Zucchini` (10.64 MB / 8:44) exceed 10 MB,
  intentionally retaining V2 quality rather than forcing a destructive cap.
- Titles and public filenames receive conservative editorial normalization—clean
  title case, removed mastering-tool suffixes, stable ASCII slugs and explicit
  version labels such as `Edit`, `Final`, `Vox`, or `Due`. No new authorship,
  album, remix or release claim may be invented.
- `Lobo-stranger_beats_carnival2023.wav` was explicitly rejected by the owner as
  unnecessary for this catalogue and moved to the recoverable system Trash. It
  must not be encoded, split, catalogued or published unless separately restored
  and reopened.
- The mandatory three-direction micro-design gate is resolved in favour of
  **Signal Border**. A thin red signal segment travels slowly around the featured
  Illobo/SOUNDTRACK choice, becomes static under reduced motion, preserves the
  normal Music/Visual launcher hierarchy and opens attribution belonging to
  Illobo rather than presenting sedicivalvole as the artist.

### Strudel evaluation and cross-cutting dependency records

| ID | Status and one-line work | Files | Half-days | Dependencies | Proposed acceptance | Main risk |
| --- | --- | --- | ---: | --- | --- | --- |
| G1 | Recorded evaluation request; no integration work. | `PIANO.md`; future research note only if reopened | 0 | G7 | Decision remains traceable. | Treating an evaluation as permission to import. |
| G2 | Updated fact: Strudel's AGPL terms are not the selected licence for original sedicivalvole material; no Strudel source or dependency is admitted. | Root licence set, future research note | 0 | G7 | PolyForm and third-party boundaries stay factual without speculative compatibility claims. | Legal overstatement from the external document. |
| G3 | Architecture fact: public client logic defeats secret-key obfuscation regardless of Strudel or repository licence. | M4 plan/licensing docs | Included in M4 | None | M4 records the source-visible boundary accurately. | False sense of technical protection. |
| G4 | Recorded technical assessment: pattern algebra may fit; scheduler replacement does not. | `PIANO.md`; optional benchmark only if reopened | 0 | G7 | Current sample-accurate worklet remains authoritative. | Future enthusiasm bypassing the scheduler gate. |
| G5 | Recorded musical risk: unconstrained recombination reopens known coherence failures. | `MUSIC-CRAFT.md` only if future experiment yields evidence | 0 | G7 | No runtime random pitch/pattern generation enters current scores. | Tool capability mistaken for product quality. |
| G6 | Owner response evaluated: no Strudel source checkout, untracked study folder, integration or source-informed clone; public documentation/theory may inform general research. | No repository or `_references/` source copy | 0 | G7 | No Strudel source is downloaded/read for implementation and no runtime/dependency enters the product. | Calling source study “clean room” would misstate the derivation boundary. |
| G7 | Recorded decision: do not adopt/fork/rewrite/integrate Strudel. | Dependency tests/package files remain unchanged | 0 | None | No `@strudel` dependency, copied source, or runtime import. | Decision rationale contains an obsolete AGPL premise; outcome still stands. |
| G8 | Deferred: a project-owned constraint-first language may be researched separately from current implementation using public documentation, papers, general theory and project-owned experiments—not Strudel source. | Future approved research doc/tests | 4+ research | New owner-approved entry | Source boundary is logged before research; harmonic/register constraints are primitives; no source-derived clean-room claim. | Scope explosion and disputed derivation boundary. |
| X3 | Recorded dependency: T1 consumers ship and are rechecked together, not as isolated fixes. | Test plan/phase tracking | 0 | T1 chain | One checkpoint covers D1/P1/P2/PF1/PF2/PM1/PA1/PP1/A3 as applicable. | D1 and A3 need domain-specific mechanics beyond scalar T1. |
| X4 | Recorded dependency: remote passenger audio work follows verified permission for each admitted source and M1. | Phase tracking | 0 | M1/S1/M11 | S2 audio controls cannot activate before source capability metadata exists. | Licence verification treated as a one-time checkbox. |
| X5 | Resolved: Strudel rejection does not make browser-delivered secrets or audio uncapturable; PolyForm changes reuse permission, not client visibility. | M4/G3 plan and licensing docs | 0 | None | Corrected architecture is owner-approved and factual docs stay synchronised. | False confidence from conflating licence and transport secrecy. |
| X6 | Recorded high-leverage equivalence: LAB and phone are protocol clients with different transports. | L5 protocol, adapters/tests | Included in L5/S2 | Q15 | Same conformance suite runs against local and WebSocket transports. | UI code bypassing protocol for convenience. |
| X7 | Planned: one server boundary for music proxy/delivery and passenger relay, with separated permissions internally. | Server architecture/implementation/tests | Included in M6/S2 | Host selection, M6/S2a | One deployment, separate routes/scopes/rate limits, no shared secret exposure. | Combining services can enlarge blast radius without isolation. |
| X8 | Planned policy: real-time macros require derivative permission; ND is excluded or effects are enforced off by typed capability. | M11 policy, M9 query, audio routing/tests | 1 | Q16, source evidence | No forbidden source can reach effect-enabled bus; metadata and UI agree. | Creative Commons/legal interpretation requires qualified review. |

## Open-question ledger

| ID | Current state | Files/evidence | Half-days | Blocks | Resolution / acceptance |
| --- | --- | --- | ---: | --- | --- |
| Q1 | Resolved by owner | PRTCL model versus global `signal-model.js` ceiling | 0 | None | PRTCL scale saturates locally at 100 km/h; global ceiling remains 130; smooth bidirectional tests required. |
| Q2 | Resolved by code audit | `prtcl-renderer.js: cameraForType()` | 0 | PM1 no longer blocked | No discrete zoom ladder exists; verify symptom through T1/LAB rather than replacing levels. |
| Q3 | Partially resolved | CodePen `NXGbBo`; current MIT public-Pen policy; embedded attributed noise terms unresolved | 0 | PP2 exact-copy path | Confirm clarification 3 or archive compatible rights for the embedded fragment; clean-room visual-fidelity route remains available. |
| Q4 | Resolved by owner | ATLAS six-second lease/tests/docs | 0 | None | Preserve exactly one fresh six-second automatic return after interaction. |
| Q5 | Resolved by owner | No Wikipedia iframe reader exists | 0 | A2/X1 only waits for visual selection | Reader works in motion with accessible type size and warm-light/dark themes. |
| Q6 | Resolved by owner | No musical macro panel exists | 0 | None | Full macro controls remain usable on the central display while moving; parked/fullscreen may be richer. |
| Q7 | Resolved in request document | S2a/X7 decision | 0 | None | Shared small server dependency accepted in principle; actual host remains evidence-based. |
| Q8 | Closed/superseded by owner | The retired source was publicly rechecked, then removed | 0 | None | Do not request account access or private subscription evidence; reopen only by explicit future decision. |
| Q9 | Resolved by owner attestation | Owner authorises complete Illobo recording use/processing/hosting and featured promotion | 0 | None; written private copy recommended | Inventory exact files and public provenance; never publish the private message. |
| Q10 | Resolved by owner | Source sentence was truncated | 0 | None | D1 is complete at road-centred, motionless zero; D3 adds nothing. |
| Q11 | Resolved by owner: option B | `LICENSE`, `LICENSE-SCOPE.md`, package metadata, README, notice, decision log | 0 | None | Original project material uses `PolyForm-Noncommercial-1.0.0`; old AGPL grants remain; third-party and reserved material stay case by case. |
| Q12 | Resolved: no source exposure | Owner offered optional study; review rejects it as incompatible with a clean-room claim | 0 | None | No Strudel source download/read/import; documentation/theory-only research may be separately approved. |
| Q13 | Resolved by owner | Licence files and answer 27 | 0 | None | Abandon client-secret claims; M4/M6 use server delivery control and safe sample config. |
| Q14 | Resolved by owner | Answers 12–13 | 0 | None | Maximum four equal controllers; room lasts for car session; named live peers; individual/all revoke. |
| Q15 | Resolved by delegated recommendation | Section 11 contradiction plus answer 3 | 0 | None | LAB and passenger clients share typed `param`/`command`/`state` protocol. |
| Q16 | Policy resolved by delegated recommendation; evidence still measurable | Jamendo API evidence/credentials not in repo | 0.5 research | X8/M9 evidence only | Exclude ND by default with no user-effects exception; re-verify API and preserve filtered coverage counts without exposing credentials. |
| Q17 | Resolved by owner | Jamendo and directly authorised Illobo | 0 | None | M11 still verifies each source's operational capabilities before admission. |
| Q18 | Resolved as optional research | No Freesound code or source admission | 0 | None | Open a licence-filtered study only if FRACTURE sourcing needs it; admit no audio during research. |
| Q19 | Resolved in request document | S2i | 0 | None | Skip remains visible outside SOUNDTRACK with concise explanation. |
| Q21 | Resolved by owner: option A | Explicit 2026-08-30 follow-up | 0 | None | Fresh sessions always start sound/effects enabled; disabled effects state does not persist. |
| Q22 | Open empirical test | No Jamendo adapter | 0.5 | M9 | Sample stream URLs are rechecked immediately and after documented age; redirects/expiry recorded. |
| Q23 | Resolved by owner | No SOUNDTRACK selector | 0 | None | Automatic pace bands affect next SOUNDTRACK selection only; manual override persists until auto is restored. |
| Q24 | Long-running measurement | DIAG reports API presence only | Included in M13 | M9 confidence | Canary evidence after reload, sleep, storage pressure where feasible, and at least one OTA boundary. |
| Q25 | Resolved: source permanently rejected | No StreamBeats source admission | 0 | None | StreamBeats stays absent from research ranking, code, UI, notices and outreach. |

## Checkpoints and owner verification

### Phase 0 — Persistence seed and reliable baseline

- Desktop: DIAG shows quota/usage, persisted before/after, capability matrix,
  canary written/read age, counter, app version/build/commit, and truthful
  vehicle-software unavailability. Saturation fixtures prove that GPS sampling
  cannot evict significant events; synthetic long tasks retain start time and
  active phase; unsupported latency remains `unavailable`, not measured zero.
  Network fixtures distinguish `online` hints from successful app requests,
  simulate active/degraded/offline/recovered states, and verify session-only
  observed download/upload totals plus rolling and peak rates without inventing
  opaque cross-origin, cache, request-header, TLS, or unrelated-device bytes.
- Tesla: open once while parked, send no telemetry automatically, then revisit
  after sleep and subsequent software updates. Photograph or send DIAG manually.
- Engineering: reproduce cold-cache JUNCTION and NIGHTSHIFT selection at
  `1.5 Mbps`, including timeout/fallback reason and automatic safe recovery;
  profile ATLAS until its repeated 23-FPS field result is explained. Resolve the
  Node/native-package architecture mismatch without modifying another machine's
  dependency state and record PHP fixture availability.

### Phase 1 — Shared response and DRIVEY

- Automated: time-step/property suites at 30/60/120 FPS, abrupt speed/macro
  sequences, zero/maximum bounds, and vendor SHA-256 integrity.
- Screen: synchronized captures or video at 0→40→100→0 for each affected scene.
- Tesla: DRIVEY held at zero for at least 30 seconds in Hood/Rear/Aerial, then a
  gentle departure; no same-direction rear traffic, drift, snap, or off-road
  recovery. Opposing traffic remains only if lane classification is reliable.

### Phase 2 — LAB/protocol

- Desktop, mobile, and exact Tesla viewport: authenticate to canonical `/lab/`,
  select each visual and independent test-audio path, move speed and the manual
  audio-level test signal independently, manipulate
  grouped controls, copy/import JSON, explicitly send the identical JSON by
  email, and compare an imported replay against the captured state.
- Access/security: `/qa-field.html` remains absent from the canonical root;
  unauthenticated `/lab/` requests expose only the login surface, protected
  assets and endpoints cannot be fetched directly, session expiry/logout revoke
  access, CSRF/origin/rate/size/schema checks fail closed, and no auth or mail
  secret appears in Git, the static bundle, responses, screenshots, or logs.
- Preset context: schema/version/build/commit/time, viewport/device/runtime,
  selected Visual/theme, input source, speed/audio level, every grouped and
  scene-specific option, protocol revision, and bounded render status are
  present. Coordinates, secrets, raw credentials, storage contents, and claims
  about device-wide traffic are absent.

### Phase 3 — Scene tuning and Gradient Field selection

- Exact viewport: owner reviews 0/40/100/130 frames and continuous ascent/descent
  video for Fractal, Murmuration, and Axiom. PRIMORDIAL is retired. Before
  `SF1` implementation, the owner selects one of exactly three original
  Gradient Field directions at `773 × 601`.
- Tesla: touch, frame pacing, acceleration/braking response, macro entry/release,
  and reduced-motion state; no scene closes until vehicle verification.

### Phase 4/5 — ATLAS and shared overlays

- Before code: exactly three zone/overlay directions at `773 × 601`; owner picks
  one.
- Browser: pitch endpoints, mouse/touch/pinch, six-second return, interpolated
  dot, road badge, compass labels, reader type/theme/focus/scroll/close,
  truthful GPS state/help/metrics, quiet-when-healthy network notice with active,
  degraded, offline and recovered states, five-second chrome, bounded fullscreen
  palettes, collapsed panel, attribution, short landscape, representative iPhone
  landscape widths and safe areas, an inert portrait rotation notice, and a live
  portrait-to-landscape transition that preserves the running session.
- Tesla: physical one/two-finger contact, real GPS cadence, road-name accuracy,
  moving/parked policy, Wikipedia frame behavior, and passenger readability.

### Phase 6/7 — Licences and SOUNDTRACK

- Evidence: primary terms/API pages dated and archived; private grants/PDFs stay
  private; notices and source capability flags agree.
- Offline/network: metadata may seed the catalogue UI but no complete Jamendo
  audio is stored for offline access. Previous/current/next browser media slots
  use the stream URL and `preload=auto` only; displaced slots are released and
  no application audio blob or persistent cache exists. Loss of signal finishes
  only what the browser already buffered, then pauses/retries SOUNDTRACK without
  changing mode. Refresh, removal, expiry, stale URL, cache eviction, retry, and
  recovery degrade honestly.
- Attribution: each audible Jamendo item exposes artist, track, optional album,
  cover, licence, provider credit, direct content link and matching QR; rapid
  skip/crossfade cannot leave the outgoing artist on screen.
- Listening: MP3 quality in cabin, level matching, effect legality/routing,
  skip/shuffle, metadata timing, artist/licence/source visibility.

### Phase 8 — Passenger control

- Local/network simulation at 50/100/200/500 ms and disconnect/reorder cases.
- Central display: participant count/names, category grants and individual/all
  revocation always win.
- Phones: QR/token rotation, four-participant cap, optimistic controls, full
  state snapshots/revisions, actor feedback, confirmed score handoff, immediate
  visual switch, 20-minute reconnect and neutral release.
- Tesla: real car/phone cellular path while parked; no phone audio and no stale
  controller after sleep/off/revoke.

## Newly assigned entries

The owner assigned stable IDs on 2026-08-30: `A5 DISCOVER`, `X9 Visual Library`,
`X10 Appearance`, `X11 CONDITIONS`, `X12 Product Identity`, and `SF1 Gradient Field`.

- The architecture-safe per-machine native cache is implemented; it leaves the
  shared Dropbox `node_modules` untouched and fixes the arm64/x64 build boundary.
- Active README/roadmap/current-state statements are reconciled to the
  PRIMORDIAL retirement; immutable deployment and changelog evidence remains.
- Decide whether the external Italian requirements source should be translated
  to English and versioned under `docs/`, or remain private/external.
- Independently verify every external API/licence conclusion in M8/M9/G2
  against current primary sources before committing it as project fact; M5 is
  closed and requires no further research while the retired source remains excluded.
- `A5`: run the DISCOVER companion surface's exactly-three-direction visual
  gate before implementation. Reuse A2/A3b,
  X1/X2 and M13 dependencies without turning ATLAS into a permanently expanded
  content panel.
- `X9` and `X10`: keep the grouped Visual Library and shared Appearance
  system. X10's persistence and AUTO resolution model exists at `[fe100b6]`;
  keep its visible control and token application with X9 in the X2 exactly-
  three-direction gate while preserving separate implementation and acceptance
  ownership.
- `X11`: verify a weather provider and privacy/attribution boundary, then
  prototype only the contextual
  exception-led value beyond Tesla's own forecast and precipitation overlay.
- `X12`: selected and implemented as **16 Road** after the mandatory three-
  direction gate. A large Orbitron weight-750 outline sits between two mirrored
  three-line roads, with the road field reaching a 15–18 px optical canvas edge.
  `logo/` contains path-only dark, warm-light, and genuine-alpha SVG masters;
  512/1024 px PNGs; 16/32/48/180/192/512 px icons; and a multi-size favicon.
  Browser favicon, Apple touch, and 192/512 product derivatives are packaged and
  advertised. Two focused checks assert the 512 viewBox, outlined text,
  symmetry, alpha color type, and packaged metadata. The owner-approved launch
  composition places the `42 px` selected mark beside the Orbitron wordmark in a
  compact `360 × 160 px` welcome surface.
- `SF1`: present exactly three directions before implementation: planar perceptual mesh,
  displaced depth, and restrained aurora/flow. Start with the project-owned
  one-pass direct-WebGL2 planar spike. Admit no ShaderGradient source/dependency
  without a measured Tesla comparison plus exact MIT/transitive-notice review,
  and admit no FeralUI or ColorFlow source, runtime, embed, preset, export,
  shader, or asset without separate explicit permission and provenance.

## Coverage audit

Deterministic source parse on 2026-08-30:

- bracketed content IDs found: **73**;
- Q IDs found: **24** (`Q1–Q19`, `Q21–Q25`; Q20 absent/retired);
- total stable IDs found: **97**;
- stable IDs represented in this plan: **97**;
- coverage: **97/97**.

Content IDs covered:
`A1 A2 A3 A3b A4 D1 D2 D3 G1 G2 G3 G4 G5 G6 G7 G8 L1 L2 L3 L4 L5 M0 M1 M1b M1c M1d M1e M2 M3 M4 M5 M5b M5c M6 M7 M8 M9 M10 M11 M13 P1 P2 PA1 PA2 PF1 PF2 PM1 PP1 PP2 S1 S2 S2a S2b S2c S2d S2e S2f S2g S2h S2i S2j S3 S4 S5 T1 X1 X2 X3 X4 X5 X6 X7 X8`.

Question IDs covered:
`Q1 Q2 Q3 Q4 Q5 Q6 Q7 Q8 Q9 Q10 Q11 Q12 Q13 Q14 Q15 Q16 Q17 Q18 Q19 Q21 Q22 Q23 Q24 Q25`.

The source document's stated **59 + 24 = 83** reference count does not match its
own stable tokens. This plan does not silently delete 14 IDs to force that
number; question 2 asks the owner to confirm the 97-ID interpretation.

## Short synthesis (maximum 15 lines)

- Sedicivalvole is already a published experimental Flux product, not an empty prototype.
- It has six active visuals, three authored adaptive scores, shared performance effects, and integrated diagnostics.
- The new request's strongest architectural idea is T1: one response mechanism, with scene-authored endpoints.
- T1 mechanics now exist and DRIVEY plus PRTCL consume them; ATLAS adoption remains in the combined X3 checkpoint.
- The existing local QA field is the correct seed for the owner-only canonical `/lab/`, provided L5 makes it a protocol client and L1 keeps every protected surface behind server-side authentication.
- ATLAS already has substantial camera, compass, travel-line, sidebar, and privacy work to preserve.
- DRIVEY can likely fix zero-speed drift in the external bridge without changing guarded upstream source.
- Music has two primary blocks: PLAY THE ROAD preserves FRACTURE/JUNCTION/NIGHTSHIFT; SOUNDTRACK owns fixed recordings.
- Passenger control is feasible only after local macros, SOUNDTRACK, typed protocol, and one evidence-based server boundary.
- Source permissions must become machine-enforced capabilities, not prose checked after playback.
- Existing public versions remain available under their published AGPL terms;
  the selected future project-code direction is PolyForm Noncommercial, with
  third-party material governed case by case and never silently relicensed.
- M13 should start first because only elapsed calendar time can prove persistence.
- Visual overlay/zone work must pass the mandatory exactly-three-direction gate before code.
- Real-Tesla touch, motion, storage, network, and listening remain final acceptance boundaries.

## Ordered work list and tracking

1. Record the closed owner decisions, complete the source-visible
   non-commercial licence migration audit, and keep every third-party grant
   scoped case by case.
2. Resolve the owner-assigned non-ID baseline entries and the supplied Tesla
   diagnostic findings, then implement M13 and plant the canary.
3. Complete the local T1/D1/D2 checkpoint and owner/Tesla acceptance, then extend T1 through the combined X3 consumers.
4. Deliver L5 and the owner-only canonical `/lab/` (L1–L4), preserving public-product separation through server-side authentication and adding complete copy/import/email preset handoff.
5. Tune PRTCL consumers in the LAB; retire PRIMORDIAL; present exactly three
   original `SF1` Gradient Field directions and implement only the selected one.
6. Preserve the implemented Instrument Deck launcher, then present exactly
   three remaining X1/X2/S3 directions covering overlays, navbar/GPS, truthful
   network activity/problems, palette/chrome behavior, the grouped Visual
   Library, interface appearance, onboarding and passenger naming; implement
   only the selected path.
7. Verify external rights/API facts and settle M4/M6/M7/M8/M11 before adding
   any SOUNDTRACK network or catalogue code; begin with the owner-ready Jamendo
   API path and keep its credentials exclusively behind the server boundary.
8. Build M1/M2/M3/M9/M10 with source-aware permissions, attribution, cache, and
   failure behavior.
9. Build S1 locally with measured automatic/manual effect strength; only then
   add the selected passenger feature through the shared protocol/server.
10. Keep PP2's exact-copy path blocked on the embedded-fragment boundary and
   keep G8 source-free unless separately reopened.

Tracking lives in this file. Each ledger row gains a dated state (`blocked`,
`in progress`, `ready for owner verification`, `verified on screen`, `verified
in Tesla`, `published`) and evidence links. A session interruption leaves the
latest row state, failing command/evidence, current commit, and next safe action
here before handoff. No row becomes `done` until its acceptance criterion and
required owner/vehicle gate are satisfied. The top-level count makes omitted
requirements visible in ten seconds.

## Best value/cost choices

1. **⭐ M13 (2 half-days):** immediate code cost is small, but every week of
   earlier canary age increases the value of the persistence evidence.
2. **⭐ T1 (3 half-days):** one implementation resolves the common mechanics
   behind P1/P2/PF1/PF2/PM1/PA1/PP1 and supports A3 conceptually, while giving
   the LAB stable parameters to tune.
3. **⭐ D2 + D1 (2.5 half-days combined):** the most visible DRIVEY defects are
   narrow, bridge-local, and testable without altering the upstream runtime.
