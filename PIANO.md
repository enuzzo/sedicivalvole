# Sedicivalvole Work Plan

Status: initial repository-backed map created on 2026-08-30. This is a plan,
not an implementation record. The external request document
`sedicivalvole-richieste-riordinate.md` was treated as proposed product intent;
repository code, tests, licences, and already-recorded decisions were inspected
independently. External service, API, and licence claims in that document have
not yet been re-verified against current primary sources.

## Questions for the product owner

Reply with one short line per number. Each question contains a proposed default
and a concrete acceptance boundary; no dependent implementation should begin
until its answer is recorded here.

1. **M5c — licence evidence:** Have all Magnific per-track licence PDFs already
   been downloaded from the account history and archived privately in two
   backed-up locations? **Answer `yes` or `no`; proposed acceptance: `yes` plus
   the archive date, without placing or naming private account files here.**

   Answer: ancora no, possiamo scaricarli, meglio usare gli mp3 di magnific o la loro API? tu cosa pensi? se ti va, posso comunque caricarteli per ora, li trovi in _references/audio/tracks - possiamo provarli e non ridistribuirli, senza problemi, come per i wav

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

    si, per me va bene, ora ti procuro anche tutte le tracce di illobo, per jamendo guidami nella creazione di una API e onora la loro licenza, se vuoi trovi anche delle track gia' pronte di magnific.ai, scarica le loro licenze in pdf o converti le pagine ecc in pdf, vogliamo essere tutelati, e ricorda che se le usiamo e  non usiamo la loro api, dobbiamo distribuirle in chunks o blob o entrambe le cose, per non incorrere in problemi legali

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
| Project identity | The sole original project creator and public licensor identity is `enuzzo`; no studio or company identity is claimed. Third-party credits remain intact. | Active product copy, metadata, notices, licence scope and current documentation use `enuzzo`. Historical changelog entries remain immutable evidence of earlier builds. This identity correction does not change AGPL's permission for commercial use. |
| Shared response and PRTCL | Use the same audio macro envelope in every visual; PRTCL scale reaches and holds its maximum at 100 km/h while the global ceiling remains 130 km/h. | T1/P2 are unblocked. Perceptual strength is added to the acceptance gate, not left as an aesthetic note. |
| DRIVEY | At zero the player car only needs to remain road-centred and motionless. Prefer opposing traffic only; if lane direction cannot be classified reliably, remove all NPC traffic. | D3 closes with no extra implementation. D2 changes from unconditional zero traffic to a measured opposing-only feasibility gate. |
| ATLAS | Preserve the six-second camera return, provisionally allow 0–85° pitch, allow Wikipedia while moving, and add reader text-size plus warm-light/dark themes. | Q4/Q5 resolve; A1/A2 acceptance expands. The exact visual treatment still waits for the mandatory three-direction gate. |
| In-motion controls | Central-display music macros remain usable while moving; parked/fullscreen may add a richer surface. | Q6 resolves in favour of availability at any speed. Interaction size, distraction and passenger reach remain Tesla acceptance checks. |
| Passenger session | Maximum four phones, authoritative live state on every phone, persistent room lifetime until the car session ends, individual/all revocation, participant count, and memorable random two-word aliases. | Q14 resolves; S2d–S2g acceptance expands. There is no 15-minute inactivity expiry. |
| Passenger naming | `PATCH` is rejected. `COPLAY`, `TUNE THE ROAD`, and `COPILOT DJ` are candidates, paired with an unmistakable multi-user icon. | S3 remains a naming/design selection, not a missing requirement. Exactly three directions will be presented before product copy changes. |
| Source structure | Product music is split into `PLAY THE ROAD` (FRACTURE, JUNCTION, NIGHTSHIFT) and `SOUNDTRACK` (fixed recordings browsed by source-supported genre and pace metadata). | M1/M1b/M1c are corrected; NIGHTSHIFT is not nested under JUNCTION and SOUNDTRACK is not speed-remixed. |
| SOUNDTRACK sources | Jamendo plus owner-authorised Illobo are the initial sources; StreamBeats is permanently rejected; Freesound remains research-only if useful. | Q17/Q18/Q25 resolve. M8 removes StreamBeats and cannot admit material before M11 evidence. |
| Illobo | The owner attests that all Illobo recordings may be used, processed, hosted as required, and prominently featured. Link/QR points to `https://soundcloud.com/illobo`. | Q9 is owner-resolved. A private written confirmation is still recommended evidence but is not treated as a second permission gate. Downloads still need a per-file provenance inventory. |
| Public contact | Use the public repository's GitHub Issues route, not a public email address. | M7 is unblocked without exposing identity or email. |
| Backend and secrets | Abandon claims of client-side protection. Use a separate evidence-selected backend, short-lived delivery authorisation, and public sample configuration only. | Q13/M4/X5 resolve. FTP access alone does not prove WebSocket, process, TLS, or secret-storage capability; M6 must audit the host before choosing a subdomain. |
| Diagnostics and toolchain | Derive Tesla software information only when the diagnostics package explicitly supports it; otherwise report unavailable. Keep per-architecture dependencies outside the Dropbox-synchronised checkout when native packages differ. The two supplied real-Tesla reports become the first field baseline for GPS, render pacing, cold-cache music readiness, long tasks and event retention. | M13 and the baseline gate are approved without overwriting another Mac's dependency state. Phase 0 also preserves significant events separately from high-rate GPS samples, attributes long tasks to time/phase, and reproduces adaptive-bank startup on a cold constrained connection. |
| Strudel | Reject the product, dependency, fork and source-derived rewrite. Do not download/read its source under a “clean-room” label; official Strudel guidance itself says source-informed clones are derivative. Public documentation or general music theory may be researched without importing source. | Q12 resolves as no source exposure; G7 remains final and G8 stays paper/documentation-only unless separately reopened. |

### Every side note mapped into the ledger

| Owner note | Tracked under | Acceptance added by this review |
| --- | --- | --- |
| UNDERWATER is nearly inaudible in NIGHTSHIFT/1980s material; OPEN is rare; BLOOM is unclear. | T1, S1, S5, X3 | Per-score audio measurements plus cabin listening; effect trigger telemetry; pronounced but level-safe sound; simultaneous visual response; a larger temporary effect badge. |
| Fullscreen palettes become oversized and should stay right-aligned with a maximum size. | X2 | Exact-viewport and fullscreen screenshots enforce a maximum width and right alignment. |
| Top/footer chrome sometimes remains open indefinitely; always hide it five seconds after the latest invocation. | X2 | Deterministic timer tests cover repeated invoke, pointer/touch, modal ownership and visibility changes. |
| GPS status should be green when live and red/struck when unavailable, with accuracy/cadence below it and illustrated Tesla enablement help. | X2, M13 | Navbar information hierarchy, truthful stale/error states, numeric accuracy/cadence, and a real-icon help overlay are included in the three-direction gate. |
| All phones should reflect current sliders, knobs, visual and selection state live; car shows count and permits individual/all revocation. | S2d–S2g | Authoritative snapshots/revisions reconcile every controller after join/reconnect and revocation wins over queued commands. |
| Manual fun effects should include flanger, reverb, chorus and beat repeat, and be strongly perceptible. | S1, M11 | The three-direction macro design must cover these desired characters without exposing raw DSP or applying derivatives where source rights forbid them. |
| A brief post-splash choice should offer PLAY THE ROAD, SOUNDTRACK or MUTE; one-time sub-four-second control glow/scale onboarding should reveal interactivity. | M1, X2 | This is a visual/product-flow proposal and therefore joins the exactly-three-direction gate; motion/reduced-motion and repeat-visit suppression are testable. |
| Effects master sits beside Mute and produces central confirmation. | S4, S5 | Default state, click-free envelope release and large non-blocking confirmation are tested together. |
| SoundCloud says tracks are downloadable. | M3, M8, M11 | Platform download availability is recorded separately from the owner's direct permission and from public playback/hosting provenance. |
| README must document every source, including VERTIGO/Tympanus and visual references. | M7, M11 | README, NOTICE, licence scope, source-admission record and third-party notices are reconciled from one audited inventory. |
| Existing Magnific MP3s may be tried locally but not redistributed. | M5/M5b/M5c | `_references/` remains untracked; local audition is allowed, product admission waits for archived terms and per-track evidence. API versus file delivery is not guessed before that evidence. |

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

### Licensing recap and recommendation

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
  rights position of Magnific, Jamendo or Illobo material.

**⭐ Recommendation: keep `AGPL-3.0-or-later` for code/docs and preserve the
current asset exclusions.** It matches the public collaborative product while
keeping audio/brand permissions separate. Relicensing is therefore not added to
the work plan unless the owner explicitly chooses a different strategic goal.
This is a practical project reading, not legal advice.

Primary-source checks used for this review:

- [GNU licence overview](https://www.gnu.org/licenses/) for AGPL's
  network-source purpose;
- [CodePen public-Pen licensing](https://blog.codepen.io/docs/pens/licensing/)
  for the current MIT default;
- [Strudel project integration guidance](https://strudel.cc/technical-manual/project-start/)
  for its AGPL/source-informed derivative boundary;
- the repository's operative `LICENSE`, `LICENSE-SCOPE.md`, `NOTICE`,
  `THIRD_PARTY_NOTICES.md`, and `docs/LICENSING.md` for the actual local scope.

No current Magnific terms/API page was independently established from a public
primary source during this review. The user's private account-history PDFs and
track records therefore remain the M5/M5c evidence gate rather than being
reconstructed from search snippets.

### Remaining clarifications after evaluation

Only these points still need confirmation before their affected implementation:

1. **S4 state wording:** this plan interprets “come da tua proposta” as: every
   fresh page session starts with sound and effects enabled; turning effects off
   is not remembered across reloads. Correct this only if “persistenti” meant
   that the off state must survive reload.
2. **S2i adaptive handoff:** the question concerns switching between PLAY THE
   ROAD scores, not SOUNDTRACK energy. Proposed behavior: finish at most the
   current eight-bar phrase, show `QUEUED`, then start the new score at phrase
   zero; SOUNDTRACK skip remains the immediate `450 ms` crossfade. Confirm or
   request immediate switching for adaptive scores.
3. **PP2 exact copy:** the supplied public CodePen is currently covered by
   CodePen's MIT default, but the Pen itself credits an embedded Inigo Quilez
   noise fragment whose independent terms were not established. An identical
   copy would also copy that fragment. Proposed safe choice: keep the published
   clean-room PRIMORDIAL and pursue visual fidelity through three original
   directions; copy source only if the embedded fragment's compatible grant or
   direct permission is archived.

S3's final name, the three UI/flow directions, Magnific evidence, Jamendo API
setup, and backend host capability are scheduled owner/technical gates rather
than missing answers now.


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
2. **Current source identity.** The plan baseline is pushed at `6f37c4d`; the
   owner-answer review is the only intended working-tree change during this
   evaluation. Version remains `0.0.0`.
3. **Current catalogue is larger than the document assumes.** Seven visuals are
   live in source (APERTURE, VERTIGO, MERIDIAN, ATLAS, DRIVEY, PRTCL,
   PRIMORDIAL) and three authored scores are ready (FRACTURE, JUNCTION,
   NIGHTSHIFT).
4. **T1 does not exist yet.** Input GPS is plausibility-bounded and smoothed, but
   visual profiles consume the latest speed and effect state directly. Scene
   mappings therefore have no shared time constant, asymmetric attack/release,
   or per-second slew limiter.
5. **P2 currently disagrees with the request.** PRTCL point scale runs linearly
   from `0.82` to `1.48` over `0–130 km/h`, with immediate uniform updates. It
   does not reach its full scale at `100 km/h`.
6. **Q2 is answered by code.** MURMURATION has one fixed camera profile with
   `zoom: 1.5`; there is no discrete speed-driven zoom ladder. The likely step is
   in shared instantaneous inputs or effect state, not discrete zoom levels.
7. **DRIVEY's likely D1 root is shared.** The untouched upstream `Car.drive()`
   skips road following and speed matching when cruise speed is zero but still
   integrates existing velocity and steering state. The external bridge can
   enforce a zero-speed road hold without altering the integrity-guarded vendor
   tree. Traffic currently defaults to 16.
8. **ATLAS already owns part of A1/A3.** Touch and mouse camera exploration,
   `18–78°` pitch bounds, a six-second automatic return, compass control, and an
   ephemeral directional travel line already pass tests. It lacks the requested
   full pitch range, round pulsing point, street badge, cardinal-only compass,
   and embedded Wikipedia reader.
9. **A3 is not just smoothing.** GPS input is about 10 Hz, but the existing map
   animation updates camera ownership on a `1100 ms` cadence and the travel line
   is a separate representation. A round vehicle point needs its own
   timestamped interpolation buffer, not only generic scalar smoothing.
10. **X1 has a useful base.** `DialogSurface` already supplies backdrop close,
    Escape close, focus trapping, focus restoration, and one-modal ownership.
    It can become the shared overlay primitive after the required three-direction
    visual gate; S5 needs a separate non-modal status surface.
11. **M13 is only partially present.** DIAG records storage estimates and API
    availability once. It does not call `persisted()`/`persist()`, write an
    IndexedDB canary, record canary age, or survive/reconcile app updates.
12. **The local LAB has a seed.** `qa-field.html` already mounts isolated fields,
    held speed, sweeps, effects, and deterministic telemetry. It is correctly
    absent from production, but it is query-string driven and has no command
    protocol, grouped controls, music selector, or JSON export.
13. **No relay or proxy exists.** The Sites worker is a static SPA fallback with
    only an asset binding; the canonical PHP surface currently serves diagnostic
    mail only. Server technology and host capabilities must be selected from
    evidence rather than assumed.
14. **G3/X5 is not resolved by rejecting Strudel.** Source, tests, CSS, and docs
    are already AGPL. Any client decryption scheme is corresponding source and
    cannot be treated as secret. This reopens the M4 architecture decision.
15. **The document's licence/API claims are imported context, not current proof.**
    Magnific terms, Jamendo API behavior/quotas/URLs, Creative Commons treatment,
    Freesound, StreamBeats, and Strudel statements require fresh primary-source
    evidence before they become repository facts.
16. **Current test baseline is environment-limited.** DRIVEY (10/10), PRTCL
    (8/8), PRIMORDIAL (8/8), and NIGHTSHIFT (9/9) focused suites pass. The full
    suite has two environment failures: the installed `esbuild` binary is arm64
    while Node runs x64, and PHP is absent for the diagnostic-mail fixture.
17. **Documentation drift already exists.** The authoritative current-state file
    records PRIMORDIAL as published, while parts of README/roadmap still describe
    it as pending. This needs a separately approved non-ID reconciliation entry.
18. **The source document is external to Git.** `PIANO.md` carries full ID
    coverage, but the original Italian source-of-truth file itself is not
    versioned. Importing or translating it requires explicit approval.

## Phase map

| Phase | Scope | Why this order | Checkpoint |
| --- | --- | --- | --- |
| 0 | M13 and baseline/toolchain gate | The storage canary needs calendar time; reliable tests are needed before product edits. | Canary appears in DIAG with age and truthful capabilities; focused and full baseline status is recorded. |
| 1 | T1, D1, D2; close D3 | Shared response mechanics must exist before scene tuning; DRIVEY zero hold is independently high-value. | Deterministic curve/envelope/slew tests pass; DRIVEY stays centred and motionless at zero, with opposing-only NPCs when reliable or no NPCs otherwise. |
| 2 | L5, L1–L4, X6 | The LAB must speak the future transport-independent protocol before scene-specific tuning. | Local-only LAB drives one scene through typed messages and exports a round-trippable preset. |
| 3 | P1, P2, PF1, PF2, PM1, PA1, PA2, PP1 | These are shared-response consumers and require the LAB to set measured endpoints. | All three PRTCL families and PRIMORDIAL sweep smoothly through 0/40/100/130 and macro attack/release. |
| 4 | X1, X2; A1, A3, A3b, A4 | Screen zones and overlay grammar precede new ATLAS chrome and onboarding. | Selected three-direction layout passes `773 × 601`; map interaction, GPS states/help, five-second chrome, bounded palettes, point interpolation, road badge, and cardinal compass pass. |
| 5 | A2, S5, S4 | A2 becomes the first modal consumer; S5 is the shared non-modal feedback system; S4 supplies a universal state action. | Reader themes/type sizing and status feedback work with touch/keyboard; effect disable releases smoothly across all scores/visuals. |
| 6 | M0, M5, M5b, M5c, M6, M7, M8, M11, Q16/Q17/Q18/Q22 evidence | Vocabulary, permissions, service architecture, and source admission must be true before catalogue code. | Primary-source evidence and private records are archived; public docs contain no secrets and M11 decides every admitted source. |
| 7 | M1, M1b–M1e, M2, M3, M4, M9, M10 | Build PLAY THE ROAD/SOUNDTRACK only after licences, vocabulary, proxy, cache, and open-source delivery reality are settled. | Seeded/offline metadata, streamed audio, attribution, two-mode selectors, onboarding, skip/shuffle, and cache refresh pass without shipping source audio. |
| 8 | S1, S3, then S2/S2a–S2j, X7 | Local musical macros precede remote control; the server is designed once for proxy plus relay. | Central display revokes immediately; up to four named phones sync complete state, respect grants, release on disconnect, and survive measured latency. |
| 9 | PP2 if Q3 is resolved | Faithful reference work cannot start without identity, licence, and a visual gate. | Exactly three reference-grounded directions are shown; selected result passes source/licence and viewport gates. |
| Deferred | G1–G8 | G7 rejects integration; G8 remains documentation/theory research only unless separately reopened. | No Strudel package/source enters the repository or an untracked study folder; any future language has a separately approved source-boundary brief. |

## Content-ID work ledger

### Shared response, DRIVEY, PRTCL, PRIMORDIAL, and LAB

| ID | Status and one-line work | Files | Half-days | Dependencies | Proposed acceptance | Main risk |
| --- | --- | --- | ---: | --- | --- | --- |
| T1 | Owner-approved: add one typed scalar/vector response mapper with curve endpoints, asymmetric time constants, slew limits, and the actual shared audio macro envelopes. | `src/response-mapping.js` (new), scene models/fields, `tests/response-mapping.test.mjs` (new) | 3 | L5 contract | Monotonic/property tests, frame-rate invariance, no overshoot, every listed scene imports the shared mapper, and audio/visual envelopes share timestamped state. | One abstraction may erase scene character if it owns values rather than response mechanics. |
| D1 | Planned: hold the upstream player car at zero velocity and road-centred state when commanded speed is zero, then resume without a teleport. | `src/environments/drivey/drivey-field.jsx`, `drivey-model.js`, `tests/drivey-model.test.mjs`, QA harness | 1.5 | T1 only for commanded transition | Zero for 10 s produces no longitudinal/lateral drift; 0→20 resumes on-road smoothly in all three cameras. | Vendor physics state may need a narrow bridge reset without touching 51 guarded files. |
| D2 | Owner-approved fallback ladder: classify lanes and retain only opposing traffic when reliable; otherwise remove all NPC traffic and retire the old count preference. | `drivey-model.js`, `drivey-field.jsx`, external bridge, `App.jsx`, Drivey tests/docs | 1 | Lane-direction feasibility audit | No same-direction rear traffic can appear in the player lane; opposing traffic is retained only with deterministic direction tests; fallback zero is stable and migrated. | Upstream generated roads may not expose a trustworthy lane-direction identity. |
| D3 | Resolved with no additional product behavior: D1's road-centred, motionless player at zero is the complete requirement. | `PIANO.md`; D1 tests | 0 | None | D1 acceptance fully covers the owner's zero-speed request. | None beyond D1. |
| P1 | Planned: route every PRTCL scale/depth response through T1. | `prtcl-model.js`, `prtcl-field.jsx`, `prtcl-renderer.js`, PRTCL tests | 1 | T1 | Abrupt input and macro sequences have continuous bounded output at 30/60/120 FPS. | GPU uniforms currently receive raw profile output every frame. |
| P2 | Owner-approved: make scale minimum at 0, maximum at 100, saturated above 100, reversible and visibly smooth without changing the 130 km/h product ceiling. | Same PRTCL files plus LAB preset schema | 1 | T1 | Dense 0→130→0 sweep proves equal curve shape up/down, visible progression and local saturation. | Conflict with global 130 km/h ceiling if implemented globally. |
| PF1 | Planned: tune Fractal's rest camera/scale smaller and its speed growth through the shared curve. | `prtcl-model.js`, `prtcl-renderer.js`, LAB config, tests | 0.5 | P2, LAB | Captures at 0/40/100 show continuous identity-preserving scale progression. | “More zoomed out” is perceptual and needs owner approval. |
| PF2 | Owner-approved: feed OPEN/UNDERWATER/BLOOM envelope values, not discrete effect names, into every PRTCL family and make each gesture visually unmistakable. | T1 module, `prtcl-model.js`, renderer uniforms, tests | 1 | T1 | Macro onset/release matches shared envelope samples across all PRTCL types; exact-viewport capture distinguishes all three at a glance. | Audio and visual clocks may disagree without timestamped snapshots. |
| PM1 | Planned: tune Murmuration's fixed camera and shared scale response; do not invent a nonexistent discrete ladder. | `prtcl-renderer.js`, `prtcl-model.js`, LAB/tests | 0.5 | T1, P2; Q2 resolved by code | Smooth sweep and owner-approved smaller rest state; no frame-to-frame discontinuity. | Symptom may originate in source particle motion rather than camera scale. |
| PA1 | Planned: apply the same shared continuity/progression contract to Axiom. | PRTCL model/renderer/LAB/tests | 0.5 | T1, P2 | Same property tests and exact-viewport sweep as Fractal/Murmuration. | Axiom has terrain and agents with different perceptual scales. |
| PA2 | Planned: separate rain density, fall speed, and wave amplitude as LAB parameters, driven by one live speed curve. | `prtcl-model.js`, `prtcl-renderer.js`, LAB schema/UI, tests | 2 | T1, L1–L5 | LAB controls each axis independently; live preset maps 0–100 monotonically; 0/40/100 captures approved. | Current “agents” are not yet a semantically explicit rain system. |
| PP1 | Planned: route PRIMORDIAL convergence, flow, and macro response through T1 without flattening touch deformation. | `primordial-model.js`, field/renderer, source utilities, tests | 1.5 | T1, L1–L5 | Step/sweep tests prove continuous output and touch remains independent. | Music-level meter itself is noisy and may need a separate response lane. |
| PP2 | Partially resolved, still blocked: reference is CodePen `NXGbBo`; public Pen code is MIT by CodePen policy, but its attributed Inigo Quilez fragment lacks confirmed compatible terms, so an identical source copy is not admitted. | PRIMORDIAL renderer/model, notices, source-admission docs | 3+ | Q3 fragment evidence or owner acceptance of clean-room route; three-direction gate | Preserve current clean-room source unless compatible fragment rights are archived; exactly three original fidelity directions; complete attribution reconciliation. | A platform default cannot safely relicense embedded third-party source. |
| L1 | Planned: evolve the existing local `qa-field.html` into a separate non-production calibration app. | `qa-field.html`, `qa/field-harness.jsx`, new `qa/lab-*`, Vite/deploy absence tests | 2 | L5, T1 | Local URL works; production build and canonical site return 404 for LAB assets. | Accidentally shipping development controls. |
| L2 | Planned: add independent speed/BPM, music, visual, and complete scene-specific controls. | LAB UI/schema plus declared per-scene parameter manifests | 3 | L1, T1 | Every active visual is selectable and its declared parameters change without reloading. | An unbounded “everything” panel becomes unusable. |
| L3 | Planned: render shared Form/Response/Macro groups from scene declarations. | LAB components/schema/tests | 1 | L2 | Every scene uses the same group order and no flat orphan control exists. | Scene-specific semantics may be forced into misleading generic labels. |
| L4 | Planned: export schema/version/date/identity and grouped values to clipboard with import/round-trip tests. | LAB preset module/UI/tests | 1 | Q30, L2/L3 | Exact JSON round-trip, unknown-major rejection, visible copy success/failure. | Clipboard permissions in embedded browsers; LAB remains desktop-local. |
| L5 | Owner-approved by delegated recommendation: define transport-neutral `param`, `command`, and `state` messages. | `src/control-protocol.js` (new), tests, LAB adapter, later relay adapter | 2 | None | Versioned schema rejects malformed/unauthorised messages; ordering and idempotency tests pass. | Over-designing distributed behavior before local needs are known. |

### ATLAS and shared interface surfaces

| ID | Status and one-line work | Files | Half-days | Dependencies | Proposed acceptance | Main risk |
| --- | --- | --- | ---: | --- | --- | --- |
| A1 | Owner-approved partial: extend existing manual camera from `18–78°` to provisional `0–85°` endpoints and preserve the six-second return. | `atlas-model.js`, `atlas-field.jsx`, `atlas-model.test.mjs`, CSS/QA | 1.5 | Exact-scene owner review | Touch/mouse hit endpoints and clamps; one fresh automatic return begins 6000 ms after the latest interaction with no repeated ownership fight. | Near-horizon MapLibre cost and building occlusion. |
| A2 | Owner-approved after visual gate: add Read more and an in-motion partial-page Wikipedia reader with shared modal behavior, small-A/large-A sizing and warm-light/dark themes. | ATLAS field, `App.jsx` shared overlay, `styles.css`, tests/notices | 2.5 | X1/X2, selected direction | X/backdrop/Escape/focus/scroll work; text sizing and themes persist accessibly; approved size/opacity at 773×601. | Wikipedia frame policy/network failure and driver distraction. |
| A3 | Partial: add a round luminous blinking vehicle point interpolated between timestamped GPS samples; retain the separate ephemeral path. | `atlas-model.js`, `atlas-field.jsx`, tests | 2 | T1 concept, GPS timestamp data | 10 Hz synthetic fixes produce smooth 60/30 FPS point motion; stale/invalid fixes freeze honestly; no coordinates in DIAG/storage. | Interpolating across bad fixes can visibly cut corners. |
| A3b | Planned: derive current road name from rendered map features and place it in the selected zone map. | ATLAS model/field, CSS, tests | 1 | Q28, X2 | Badge never overlaps compass; no extra network call; absent/multilingual names degrade cleanly. | Tile feature schemas vary by zoom and road class. |
| A4 | Planned: replace degree text with N/NE/E/SE/S/SW/W/NW labels, using product-language direction naming consistently. | `atlas-model.js`, field, tests/CSS | 0.5 | X2 | Eight deterministic sectors including wraparound; no numeric degrees in visible UI. | Italian `O/SO/NO` versus English-source UI requirement must be resolved as English W/SW/NW. |
| X1 | Planned: define one modal manager/primitive plus one non-modal status layer for A2/S1/M2/S5 and GPS help. | `App.jsx` component extraction, `styles.css`, accessibility tests | 2 | three-direction gate | Only one modal owns focus; replacement/close rules are deterministic; status feedback never blocks. | Treating transient feedback as a modal would violate S5. |
| X2 | Expanded visual gate: produce exactly three coherent screen-zone/onboarding directions covering compass, road badge, GPS truth/help/metrics, participant count, passenger/modal area, status, top bar, five-second chrome, bounded right-aligned fullscreen palettes, post-splash mode choice, and 64 px footer. | Design evidence doc and later CSS/App/ATLAS | 2 | visual gate | Owner selects one map at 773×601; real icons and hierarchy are verified; chrome always hides five seconds after latest invocation; fullscreen palette has a tested max width; one-time onboarding lasts <4 s and respects reduced motion. | Scope density can obscure the driving field and map attribution. |

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
| M1 | Owner-corrected architecture: two primary music blocks—PLAY THE ROAD containing FRACTURE/JUNCTION/NIGHTSHIFT, and SOUNDTRACK containing fixed recordings browsed by genre and source-supported pace metadata. | `score/genres.js` refactor, App controls, audio engine, protocol/tests/docs | 4 | M0, M5/M6/M8/M9 | Both blocks and all three authored scores remain reachable; only SOUNDTRACK exposes a recording catalog; active mode/source is always explicit. | A second hierarchy can become too deep at 773×601. |
| M1b | Recorded labels: primary blocks are PLAY THE ROAD and SOUNDTRACK; launch helper copy explains the difference. | Same registry/UI/docs | Included in M1 | X2 onboarding selection | Exact English labels and concise meaning appear consistently without reviving obsolete service terminology. | Product copy can over-explain the launch surface. |
| M1c | Recorded mapping: PLAY THE ROAD music/effects may adapt to driving; SOUNDTRACK recordings never change tempo/selection mid-track from speed, while separately permitted vehicle/manual effects may process them. | Audio routing, score/source metadata, tests | 1 | M1, S4, X8 | Speed cannot re-time or replace the active SOUNDTRACK item; capability flags gate every effect bus. | Applying effects to ND or source-restricted tracks. |
| M1d | Planned: use source genre/pace metadata for browsing and next-track selection only, never mid-track switching. | Catalog selector, protocol/state, tests | 1.5 | M9, Q23 | Driving-band changes affect the next choice only; deterministic seeded tests cover all bands. | Source metadata quality and semantics may be inconsistent. |
| M1e | Planned: five plain-language driving rhythm bands with automatic/manual modes. | SOUNDTRACK UI/schema/catalog query/tests | 1.5 | Q23, M1d | Every band has visible explanatory copy; manual override and restore-auto are unambiguous. | Italian labels in the request must become approved English product copy. |
| M2 | Expanded: skip, shuffle, title/artist, source-aware attribution, post-splash PLAY THE ROAD/SOUNDTRACK/MUTE choice, and selected one-time control onboarding. | App shared overlay/status, audio controller, CSS/tests | 3.5 | M1, M10, X1/X2, S2i | Controls work at 773×601; attribution stays visible; rapid skip metadata never goes stale; chosen onboarding completes under four seconds and respects reduced motion. | Mandatory attribution and onboarding can overload the launch flow. |
| M3 | Owner-authorised: prominent Illobo featured selection inside SOUNDTRACK, complete per-file provenance, and QR/link to `https://soundcloud.com/illobo`; private written confirmation recommended. | Catalog seed/source adapter, UI/notices/tests | 1.5 | M11, owner-supplied/approved file inventory | Only owner-authorised works appear; each carries source/licence capability flags; QR/link is tested and featured treatment is explicit. | Platform download status is not a substitute for the direct grant or provenance. |
| M4 | Owner-approved AGPL-aware delivery: no client-secret/protection claim; protected local sources use server-authorised short-lived segmented delivery, never Git audio, with harmless public sample configuration only. | Server delivery, client Media Source/blob path, `.gitignore`, sample config, docs/tests | 3 | source-specific grants, M6 | No source audio/credential/private host data in Git/static build/logs; expiring authorisation and segmented playback; docs call it delivery control, not protection. | Browser users can always capture decoded audio; network dependence in car. |
| M5 | Verify before relying: archive current Magnific terms and per-track evidence; local MP3 audition under `_references/` is allowed but product admission/API choice waits for evidence. | Private archive (user), public `docs/LICENSING.md` summary after verification | 0.5 + user action | M5c | Primary terms/date/plan, API/file rights and allowed use are recorded without private documents; no unverified track ships. | Terms drift and legal interpretation. |
| M5b | Recorded proposed boundary pending verification: Magnific only as audiovisual soundtrack material, never the SOUNDTRACK browsing catalog. | Catalogue capability metadata, docs/tests | 0.5 | M5 | Magnific items cannot appear in genre/mood browsing or phone track selection. | The attached document's legal conclusion is not independent legal advice. |
| M5c | Persistent user action: download/archive licence PDFs while subscription access exists. | Private storage only; `PIANO.md` reminder state | 0 | Owner confirmation | Explicit owner confirmation with archive date; reminder then removed from session reports. | Evidence becomes unavailable after subscription changes. |
| M6 | Planned source/server strategy: first audit the offered host beyond FTP, then deploy one minimal service for API proxy, catalogue refresh, delivery authorisation, and later relay on a purpose-specific subdomain such as `api.sedicivalvole.app`. | New server project/location after host decision, client adapters, tests/docs | 4 | X7, source verification, host capability evidence | TLS, runtime/process lifecycle, WebSocket, secret storage, logging and deploy/rollback are evidenced; credentials never reach browser/logs; offline catalogue and honest failure pass. | FTP-only hosting may not support a persistent relay or secure secret boundary. |
| M7 | Owner-resolved contact: add an English music/licensing/removal policy and complete source inventory using the public repository's GitHub Issues route, not public email. | `README.md`, `docs/LICENSING.md`, `NOTICE`, `THIRD_PARTY_NOTICES.md` | 1.5 | M11 evidence | Public GitHub destination works; VERTIGO/Tympanus and every admitted/referenced source reconcile across documents; no private evidence or overclaim. | “Remove on request” does not substitute for permission. |
| M8 | Narrowed research ledger: re-verify Jamendo, Freesound, FMA and SoundCloud on primary sources; StreamBeats is permanently rejected and absent. | `docs/SOURCE-ADMISSION-*`, `THIRD_PARTY_NOTICES.md` only after admission | 1.5 | Q17/Q18 | Dated source URLs, exact terms/API facts and M11 answers; no unapproved audio downloaded; StreamBeats has no code/UI/outreach. | Platform terms and API access drift. |
| M9 | Planned Jamendo integration: proxy-populated cache, seed metadata, monthly/manual refresh, stable-URL and ND measurements. | Server adapter, `src/soundtrack/catalog-store.js`, IndexedDB module, seed JSON, tests | 4 | M6, M8, M13, Q16/Q22 | Offline seed boot, versioned cache, stale refresh, 200-item paging, URL-age evidence, no waveform/download URL. | Tesla storage eviction and stream URL expiry. |
| M10 | Planned source-aware visible attribution and Music & Licences settings page. | Track state/UI, settings surface, catalogue schema, tests/notices | 2 | M1/M9, X1/X2 | Artist/title/licence/source link visible per active Jamendo track; settings list matches active sources. | Overlay density versus mandatory visibility. |
| M11 | Planned admission gate: derivatives, in-app selection, and no-host playback answers become typed source capabilities. | `src/soundtrack/source-policy.js`, tests, licensing docs | 1 | Fresh primary evidence | Unknown/false capability prevents admission or effect routing by construction. | Reducing nuanced licences to booleans without preserving evidence. |
| M13 | Expanded from real-Tesla evidence: add the persistent-storage probe and long-lived IndexedDB canary; expose vehicle software only when explicitly supported; preserve coordinate-free GPS cadence/accuracy; retain significant events independently of GPS saturation; add phase/timestamp context to long tasks; distinguish unavailable output latency from measured zero. | New storage probe module, `App.jsx`, diagnostics model/UI/tests/docs | 3 | architecture-safe local baseline | Canary identity survives reload; no coordinates are retained; 240+ GPS samples cannot evict early significant events; a synthetic long task reports start/phase/renderer; unavailable latency is truthful; supplied field reports remain parseable. | Persistence needs elapsed time; added observability must stay bounded and must not collect sensitive location data. |

### Strudel evaluation and cross-cutting dependency records

| ID | Status and one-line work | Files | Half-days | Dependencies | Proposed acceptance | Main risk |
| --- | --- | --- | ---: | --- | --- | --- |
| G1 | Recorded evaluation request; no integration work. | `PIANO.md`; future research note only if reopened | 0 | G7 | Decision remains traceable. | Treating an evaluation as permission to import. |
| G2 | Corrected fact: Strudel AGPL is not a new whole-app cost because Sedicivalvole is already AGPL; dependency/source licences still require review. | Root licence set, future research note | 0.5 | Primary-source re-verification | No claim that rejecting Strudel changes this repo's AGPL status. | Legal overstatement from the external document. |
| G3 | Reopened architecture conflict: public client logic defeats secret-key obfuscation regardless of Strudel. | M4 plan/licensing docs | Included in M4 | question 27 | M4 records the current AGPL boundary accurately. | False sense of technical protection. |
| G4 | Recorded technical assessment: pattern algebra may fit; scheduler replacement does not. | `PIANO.md`; optional benchmark only if reopened | 0 | G7 | Current sample-accurate worklet remains authoritative. | Future enthusiasm bypassing the scheduler gate. |
| G5 | Recorded musical risk: unconstrained recombination reopens known coherence failures. | `MUSIC-CRAFT.md` only if future experiment yields evidence | 0 | G7 | No runtime random pitch/pattern generation enters current scores. | Tool capability mistaken for product quality. |
| G6 | Owner response evaluated: no Strudel source checkout, untracked study folder, integration or source-informed clone; public documentation/theory may inform general research. | No repository or `_references/` source copy | 0 | G7 | No Strudel source is downloaded/read for implementation and no runtime/dependency enters the product. | Calling source study “clean room” would misstate the derivation boundary. |
| G7 | Recorded decision: do not adopt/fork/rewrite/integrate Strudel. | Dependency tests/package files remain unchanged | 0 | None | No `@strudel` dependency, copied source, or runtime import. | Decision rationale contains an obsolete AGPL premise; outcome still stands. |
| G8 | Deferred: a project-owned constraint-first language may be researched separately from current implementation using public documentation, papers, general theory and project-owned experiments—not Strudel source. | Future approved research doc/tests | 4+ research | New owner-approved entry | Source boundary is logged before research; harmonic/register constraints are primitives; no source-derived clean-room claim. | Scope explosion and disputed derivation boundary. |
| X3 | Recorded dependency: T1 consumers ship and are rechecked together, not as isolated fixes. | Test plan/phase tracking | 0 | T1 chain | One checkpoint covers D1/P1/P2/PF1/PF2/PM1/PA1/PP1/A3 as applicable. | D1 and A3 need domain-specific mechanics beyond scalar T1. |
| X4 | Recorded dependency: remote passenger audio work follows verified source permission and M1. | Phase tracking | 0 | M5/M1/S1 | S2 audio controls cannot activate before source capability metadata exists. | Licence verification treated as a one-time checkbox. |
| X5 | Reopened: Strudel rejection does not remove AGPL/client-obfuscation limits. | M4/G3 plan and licensing docs | 0.5 | question 27 | Corrected architecture is owner-approved and factual docs stay synchronised. | External document currently labels this resolved. |
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
| Q8 | Resolved in request document, not independently verified | M5 says Premium | 0 | M5 verification | Preserve private subscription evidence; re-check current terms. |
| Q9 | Resolved by owner attestation | Owner authorises complete Illobo recording use/processing/hosting and featured promotion | 0 | None; written private copy recommended | Inventory exact files and public provenance; never publish the private message. |
| Q10 | Resolved by owner | Source sentence was truncated | 0 | None | D1 is complete at road-centred, motionless zero; D3 adds nothing. |
| Q11 | Resolved by operative policy and recommendation | `LICENSE`, `LICENSE-SCOPE.md`, package metadata; owner requested explanation, not relicensing | 0 | None | Keep `AGPL-3.0-or-later` for code/docs and separate asset exclusions unless owner explicitly changes strategy. |
| Q12 | Resolved: no source exposure | Owner offered optional study; review rejects it as incompatible with a clean-room claim | 0 | None | No Strudel source download/read/import; documentation/theory-only research may be separately approved. |
| Q13 | Resolved by owner | Licence files and answer 27 | 0 | None | Abandon client-secret claims; M4/M6 use server delivery control and safe sample config. |
| Q14 | Resolved by owner | Answers 12–13 | 0 | None | Maximum four equal controllers; room lasts for car session; named live peers; individual/all revoke. |
| Q15 | Resolved by delegated recommendation | Section 11 contradiction plus answer 3 | 0 | None | LAB and passenger clients share typed `param`/`command`/`state` protocol. |
| Q16 | Policy resolved by delegated recommendation; evidence still measurable | Jamendo API evidence/credentials not in repo | 0.5 research | X8/M9 evidence only | Exclude ND by default with no user-effects exception; re-verify API and preserve filtered coverage counts without exposing credentials. |
| Q17 | Resolved by owner | Jamendo and directly authorised Illobo | 0 | None | M11 still verifies each source's operational capabilities before admission. |
| Q18 | Resolved as optional research | No Freesound code or source admission | 0 | None | Open a licence-filtered study only if FRACTURE sourcing needs it; admit no audio during research. |
| Q19 | Resolved in request document | S2i | 0 | None | Skip remains visible outside SOUNDTRACK with concise explanation. |
| Q21 | Resolved under explicit interpretation | Answer 16 says always active “come da tua proposta” | 0 | None unless owner corrects clarification 1 | Fresh sessions always start sound/effects enabled; disabled effects state does not persist. |
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

- Desktop only: select each visual/music path, move speed and BPM independently,
  manipulate grouped controls, copy/import JSON, and compare identical replay.
- Production: built/canonical `/qa-field.html`, LAB modules, and preset endpoints
  remain absent/404.

### Phase 3 — Scene tuning

- Exact viewport: owner reviews 0/40/100/130 frames and continuous ascent/descent
  video for Fractal, Murmuration, Axiom, and PRIMORDIAL.
- Tesla: touch, frame pacing, acceleration/braking response, macro entry/release,
  and reduced-motion state; no scene closes until vehicle verification.

### Phase 4/5 — ATLAS and shared overlays

- Before code: exactly three zone/overlay directions at `773 × 601`; owner picks
  one.
- Browser: pitch endpoints, mouse/touch/pinch, six-second return, interpolated
  dot, road badge, compass labels, reader type/theme/focus/scroll/close,
  truthful GPS state/help/metrics, five-second chrome, bounded fullscreen
  palettes, collapsed panel, attribution, and short landscape.
- Tesla: physical one/two-finger contact, real GPS cadence, road-name accuracy,
  moving/parked policy, Wikipedia frame behavior, and passenger readability.

### Phase 6/7 — Licences and SOUNDTRACK

- Evidence: primary terms/API pages dated and archived; private grants/PDFs stay
  private; notices and source capability flags agree.
- Offline/network: seed catalog starts without network; refresh, expiry, stream
  failure, stale URL, cache eviction, and manual refresh degrade honestly.
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

## Proposed new entries requiring an owner-assigned ID

These were discovered in the repository and are deliberately **not** assigned
invented IDs:

- Establish an architecture-safe local dependency layout for the Dropbox
  checkout; current arm64 `esbuild` and x64 Node prevent a green full suite.
- Reconcile stale README/roadmap statements with the authoritative published
  PRIMORDIAL state.
- Decide whether the external Italian requirements source should be translated
  to English and versioned under `docs/`, or remain private/external.
- Independently verify every external API/licence conclusion in M5/M8/M9/G2
  against current primary sources before committing it as project fact.

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
- It has seven active visuals, three authored adaptive scores, shared performance effects, and integrated diagnostics.
- The new request's strongest architectural idea is T1: one response mechanism, with scene-authored endpoints.
- T1 is absent today even though GPS input itself is already smoothed and plausibility-bounded.
- The existing local QA field is the correct seed for LAB, provided L5 makes it a protocol client.
- ATLAS already has substantial camera, compass, travel-line, sidebar, and privacy work to preserve.
- DRIVEY can likely fix zero-speed drift in the external bridge without changing guarded upstream source.
- Music has two primary blocks: PLAY THE ROAD preserves FRACTURE/JUNCTION/NIGHTSHIFT; SOUNDTRACK owns fixed recordings.
- Passenger control is feasible only after local macros, SOUNDTRACK, typed protocol, and one evidence-based server boundary.
- Source permissions must become machine-enforced capabilities, not prose checked after playback.
- The repository is already AGPL, so client-side audio secrecy is not restored by rejecting Strudel.
- Keeping AGPL for code/docs does not automatically license the separately excluded original audio.
- M13 should start first because only elapsed calendar time can prove persistence.
- Visual overlay/zone work must pass the mandatory exactly-three-direction gate before code.
- Real-Tesla touch, motion, storage, network, and listening remain final acceptance boundaries.

## Ordered work list and tracking

1. Obtain only the three remaining clarifications in the evaluation section;
   all other answers and side notes are already mapped to stable rows.
2. Resolve the owner-assigned non-ID baseline entries and the supplied Tesla
   diagnostic findings, then implement M13 and plant the canary.
3. Deliver T1 with D1/D2, then run the combined X3 regression checkpoint.
4. Deliver L5 and the local-only LAB (L1–L4), preserving production exclusion.
5. Tune PRTCL/PRIMORDIAL consumers in the LAB and obtain viewport plus Tesla
   acceptance.
6. Present exactly three X1/X2/S3 directions covering overlays, navbar/GPS,
   palette/chrome behavior, onboarding and passenger naming; implement only the
   selected path.
7. Verify external rights/API facts and settle M4/M5/M6/M7/M8/M11 before adding
   any SOUNDTRACK network or catalogue code.
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
