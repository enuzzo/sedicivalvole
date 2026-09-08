# Engine Listening Room

Owner-selected compact local research catalogue: 111 auditions (100 previously acquired files, eight prepared excerpts and three SFXMint generated WAVs). This is a standalone development tool, not the protected product LAB or a deployed product change.

From the repository root:

```sh
python3 tools/engine-listening-room/prepare.py
python3 tools/engine-listening-room/serve.py
```

Open http://127.0.0.1:8767/ on this Mac. Keep the server running. After preparation, restarting only needs `serve.py`: all media is copied into ignored `_references/engine-listening-room/`. Preparation uses the original `/tmp/sedicivalvole-engine-research-20260908` input, or `--sources PATH`, and verifies all source hashes before copying. No audio enters Git.

Search by code, title or creator; filter by family/preparation. Each row has play/pause, seeking, optional repeat, rating and comment. One shared audio element plays at 1x; source levels remain intact and output starts at 35%. Loop repeats the file; it does not repair seams. `-X` identifies an already prepared excerpt whose changes are disclosed under Details & license. Other prefixes identify V8, R8, turbine, four-cylinder, motorcycle, unidentified car, FX and generated AI candidates. Codes and hashes are permanent identities: assign a new code for a changed sound.

Notes persist in this browser at this exact origin, with a source hash check. They are not automatically sent to the assistant. Use Export notes and share the JSON, or quote codes in chat. Clearing browser storage loses local notes; exports are the portable backup. There is no import or cloud synchronization. Browser storage failures retain new notes in memory and display an export warning. Comments are bounded to 2,000 characters per item.

Architecture: static HTML/CSS, dependency-free JavaScript, localStorage notes, explicit JSON export and a Python standard-library server with byte-range support. Server binds localhost only and serves only the prepared folder. No telemetry, credentials or production services. `catalog.json` pins authorship, declared terms, source URLs, preparation, decoder warnings and hashes. Prepared `SOURCE-NOTICES.md` retains every credit. Original project licensing does not relicense source audio.
