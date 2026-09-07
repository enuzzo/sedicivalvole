# Canonical night checkpoint — September 7, 2026

Build **20260907-2243**, source **0ab8ebe**. These are fresh screenshots of the
canonical product, captured in isolated Chrome. Engine GPS is injected for QA;
this is not a real vehicle trip or physical listening approval. Phone captures
use 667×375 with simulated 59 px side/21 px bottom safe areas.

- `intro-773x601.png`: initial chooser and actual build identity.
- `engine-773x601.png`: confirmed simulated stop, automatic idle gesture status
  and persistent TAMARRO controls.
- `phone-engine-667x375.png`: selected Compact Cockpit.
- `phone-report-667x375.png`: actual Travel Report controls with the explicit
  route option selected by the test. Precise route is OFF by default.

[Evidence](evidence.json) records package, HTTP identity/cache and behavior checks.
No diagnostic/report email is sent by these browser tests. Generated PDF fixture
graphs are not published as a real journey. Original screenshots remain excluded
from the source-code license under LICENSE-SCOPE.
