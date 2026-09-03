# Rolling-window acceleration detector — 2026-08-29

> Historical study. OPEN and BLOOM were retired on 2026-09-03 after physical
> vehicle listening found no useful perceptual contribution. The detector,
> audio paths, worklet, visual mappings and LAB controls described below are no
> longer part of the current product; Git retains this evidence.

## Vehicle evidence

The detector is calibrated against current first-party Tesla specifications,
not an instantaneous browser-speed derivative:

- Tesla lists the current Model 3 Long Range AWD at **4.4 seconds from 0 to
  100 km/h** and 1,824 kg curb mass on its official European Model 3 page.
  Source: [Tesla Model 3 Germany](https://www.tesla.com/de_de/model3).
- Tesla lists the current Model 3 Performance at **3.1 seconds from 0 to
  100 km/h** and 1,851 kg curb mass on its official Italian Model 3 page.
  Source: [Tesla Model 3 Italy](https://www.tesla.com/it_it/model3).
- Tesla documents that available acceleration varies by vehicle, region,
  software and selected acceleration mode. Source:
  [Tesla Model 3 acceleration modes](https://www.tesla.com/ownersmanual/model3/en_ie/GUID-8EAFF5D8-7209-45ED-A7E0-508FFA60C530.html).

The 4.4-second AWD reference averages 22.73 km/h per second, or 6.31 m/s²,
over 0–100 km/h. At that average, a 30 km/h rise takes 1.32 seconds and a
40 km/h rise takes 1.76 seconds. The Performance reference is faster still:
32.26 km/h per second, or 8.96 m/s², with the same rises taking approximately
0.93 and 1.24 seconds. These are whole-run averages, not claims about the
instantaneous acceleration curve.

## Detector contract

The browser exposes GPS-derived speed, not pedal position or an automotive
accelerometer. A rolling speed trajectory is therefore more defensible than a
single derivative whose magnitude changes with the browser's callback cadence.

OPEN crosses once when all of the following are true:

1. speed rises by at least **30 km/h** inside a **2.2-second** rolling window;
2. the average rise is at least **3.8 m/s²**;
3. the trajectory contains at least three supported samples, including an
   intermediate rise of at least 6 km/h;
4. no accepted sample gap exceeds 1.4 seconds;
5. no reversal inside the candidate trajectory exceeds 4 km/h; and
6. reported horizontal accuracy is no worse than 25 metres when available.

The 2.2-second window preserves three-point confirmation at a one-second GPS
cadence while remaining well below an ordinary urban 0–50 km/h acceleration
spread across roughly six seconds. The separate rise and average-rate gates
reject both slow ramps and short low-amplitude noise.

BLOOM is the higher tier of the same confirmed trajectory: at least a 34 km/h
rise, 5.2 m/s² average acceleration and 0.7 normalized intensity. It no longer
depends on seeing an arbitrary 300 ms derivative crossing.

## Noise, release and re-entry

- A gap longer than 1.6 seconds makes the trajectory stale and releases OPEN.
- A trusted braking state releases OPEN immediately.
- Once recent acceleration stays at or below 1.15 m/s² for 600 ms, the curve is
  considered normalized and OPEN releases.
- A hard maximum hold of 4.6 seconds prevents a lost release from latching.
- A five-second refractory period begins on release, preventing braking or a
  boundary reversal from retriggering the same launch.
- Fixes worse than 25 m accuracy cannot add evidence. They also cannot fabricate
  vehicle speed, diagnostics coordinates or a launch event.

The tests cover a full-throttle AWD-shaped curve, one-second GPS cadence,
ordinary urban acceleration, one-point GPS spikes, inaccurate fixes, stale
gaps, braking, normalization and acceleration/braking reversals. Real-vehicle
acceptance still requires a Tesla drive with the browser's actual GPS cadence.
