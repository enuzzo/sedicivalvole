# TRACE phone companion: first run and recovery

This guide includes the September 19 reliability corrections. The current
publication identity is recorded in [Current state](CURRENT-STATE.md). Real
Safari/iPhone/Tesla connectivity, sensors and screen-wake retention remain open.

## First run, while parked

1. Open `https://sedicivalvole.app/` in the Tesla browser and start the experience.
   Tap the field to reveal the navigation, then tap the phone/waves icon.
2. Choose **CREATE QR**. Scan it with iPhone Camera and open the result in Safari.
   Use the same Wi-Fi for the first attempt where possible. Both devices need
   access to the site and a network path to each other; the same Wi-Fi is not
   a guarantee if the router isolates clients. Separate cellular connections
   and Tesla/iPhone hotspot combinations have not been physically verified.
3. Place the iPhone securely in its holder, including portrait at about 45°.
   Tap **ENABLE & CONNECT** and allow the requested motion/orientation access.
4. Keep the phone still and tap **ZERO**, below the graph. It should confirm
   the reference. A rejected ZERO means data is incomplete, old or the phone
   is moving; wait until steady and try again. If a previous reference is still
   valid, a rejected recalibration explicitly says that readings keep using it.
5. Check both parts of success: **Connected to Tesla** on iPhone and
   **Phone connected** on Tesla for the link, and usable
   acceleration/gyro with **Zero SET / REFERENCE SET** for sensing. A moving
   trace on the iPhone alone does not prove the Tesla receives it.
6. Once paired, CLOSE the Tesla pairing panel to return to the experience;
   this does not disconnect the session. Keep both browser pages visible.
   **SCREEN AWAKE** means the phone has an actual
   screen-wake lock. It is not a guarantee of background execution.

Opening `https://sedicivalvole.app/?motion=phone` directly is a local sensor test;
it explicitly shows **Local only · not connected to Tesla** and
**ENABLE LOCAL SENSORS**. It cannot connect without scanning a new Tesla QR.
Reloading a phone page also removes pairing context: scan a new QR instead of
expecting the local instrument to reconnect.

## What the instrument means

- ZERO saves the current pose as the reference. No leveling is required, but
  ZERO does not discover the vehicle's forward direction or remove hand motion.
- The cube contains the last three seconds of acceleration history in m/s².
  It is not the phone's path through space, a position estimate or a road map.
- The small phone shows rotation relative to the reference. Rotation values
  below the plot are angular velocity in degrees per second.
- Dragging the cube or pressing **RECENTER VIEW** changes only the viewing angle.
  If you physically move the phone to another mounting position, use ZERO again.
- GPS/Demo still supplies road speed. The companion does not replace it, control
  the car, or bend Aperture yet. That visual response is a separate next step.

## Recovery and fallbacks

| What happens | Meaning and action |
| --- | --- |
| QR expires or has already been used | The QR admits one phone and expires after three minutes. It disappears from Tesla as soon as a phone has joined. On Tesla, choose DISCONNECT if the old attempt is still pending, then CREATE QR and scan the new code. |
| Connection fails or remains pending | Setup times out after 30 seconds; each HTTP request has a 10-second limit. Keep both pages visible and verify their network access. Try a shared network that allows device-to-device traffic. There is no Internet relay fallback. Reset the attempt with DISCONNECT / CREATE QR rather than repeatedly reloading an old phone link. |
| STOP, DISCONNECT, reload, hidden page or screen lock | Treat the connection as ended. Return to the Tesla phone panel, generate a new QR, scan it, enable sensors and set ZERO again. There is no promised automatic reconnection in this baseline. An open link also expires after one hour. |
| Connected but values are dashes, Sensors: incomplete or Zero REQUIRED | Transport and sensing are separate. Check permissions, keep the page visible, wait for fresh complete sensor values and set ZERO while still. If access was denied, use **RETRY SENSORS** while the connection is still open. This retries permissions without reusing the QR. Review Safari/site permissions if it remains denied; do not assume reloading overrides a stored denial. |
| Values become old or sensors pause | Samples expire after 250 ms. Old values are not replayed as live data; the trace clears and the reference may need ZERO again. Re-pair if the transport also ended. |
| SCREEN MAY SLEEP | Wake lock was denied, released or is unsupported. Use KEEP SCREEN AWAKE if offered; success must change the status to SCREEN AWAKE. If unavailable, keeping the page visible does not itself prevent screen lock. A manually chosen Auto-Lock setting is outside the app's control. |
| 3D unavailable or graphics interrupted | Numeric readings can continue when sensors are valid. The cube reports graphics unavailability; context recovery restarts without replaying stale history. If a reload is needed, re-pair afterward. |
| OUT OF RANGE | The graph cannot display that sample in its bounded range; it does not clip it into a plausible trace. Secure the phone and inspect the numeric readings. |

The main Tesla experience continues to use its existing GPS/Demo input when the
companion is absent. The app does not manufacture working sensors, a connection
or screen-wake success. A lost link stops the phone sensors, clears ZERO and
releases its wake lock. **ENABLE LOCAL SENSORS** can explicitly restart a local
test afterward, but only a new scan reconnects to Tesla. Missing axes also
invalidate ZERO; returning data cannot silently revive the old reference.

A long sensor wait, partial permission, incomplete readings and stale data now
have separate visible guidance. STOP is always available to cancel. There are
no automatic reconnection attempts or silent retries of consumed QR codes.

## A short acceptance run

While parked, try connection and ZERO in the holder; look for a nearly still
trace, then deliberately rotate the phone slightly and return it to the holder.
Recalibrate after remounting. Try STOP and the full new-QR recovery path. Also try
backgrounding Safari and returning, confirming that the UI explains the restart.
Keep road observations separate from interaction tests while parked.

To judge onboarding, first try the visible interface without this guide. Note
where the next action is unclear, where waiting has no explanation, or where a
local trace looks connected to the Tesla when it is not.

Before reloading after a failure, preserve the phone evidence if possible:
**Connection & sensor diagnostics → DOWNLOAD PHONE REPORT**. On Tesla use
**REPORT → SEND DIAGNOSTIC** (wait for its server response) or **COPY REPORT**.
Do not use RESET SAVED STATE as a normal reconnection step. Automatic reporting
can be OFF or may not be due yet; do not rely on it for a short test. Server mail
acceptance does not prove inbox delivery, and I do not automatically receive or
read these reports merely because the feature captured them.

Record build, iPhone/iOS and Tesla software versions, network arrangement,
approximate time, visible message and action that preceded the failure. Reports
exclude raw sensor histories, coordinates and pairing keys. The phone report is
especially important when pairing never succeeded: Tesla cannot record phone
events it never received.
