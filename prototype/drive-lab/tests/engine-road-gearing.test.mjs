import assert from "node:assert/strict";
import test from "node:test";
import { focusedCrossfade } from "../src/engine/sample-mix.js";
import { build } from "esbuild";
import { ENGINE_ROAD_SPEED_CEILING_KMH, VIRTUAL_WHEEL_RADIUS_M, engineRoadSpeed,
  virtualRpm, roadUpshiftSpeed, selectRoadGear, decideAutomaticGear } from "../src/engine/gearbox.js";

const compiled = await build({ entryPoints: [new URL("../src/engine/profiles.js", import.meta.url).pathname],
  bundle: true, format: "esm", platform: "node", write: false });
const { ENGINE_PROFILES } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);
const roads = ENGINE_PROFILES.filter(profile => !profile.singleSpeed);

test("recording selection reduces competing layers without losing expected mix energy", () => {
  let previous = 0;
  for (let i = 0; i <= 1000; i++) {
    const { gain1, gain2 } = focusedCrossfade(i / 1000, 0, 1);
    assert.ok(Math.abs(gain1 ** 2 + gain2 ** 2 - 1) < 1e-12);
    assert.ok(gain1 >= previous && gain1 - previous < .004);
    previous = gain1;
  }
  assert.ok(focusedCrossfade(.2, 0, 1).gain1 < .11);
  assert.ok(focusedCrossfade(.8, 0, 1).gain2 < .11);
  assert.deepEqual(focusedCrossfade(-1, 0, 1), { gain1: 0, gain2: 1 });
});
const rpmAt = (speed, load, profile) => virtualRpm(speed, selectRoadGear(speed, load, profile), profile.configuration.drivetrain);
const choose = (profile, input) => decideAutomaticGear({ canShift: true, heldSeconds: 2, drive: .2, ...input }, profile, profile.configuration.drivetrain);

test("road RPM uses fixed physical-scale ratios and one declared virtual rolling radius", () => {
  assert.equal(VIRTUAL_WHEEL_RADIUS_M, .32);
  for (const profile of roads) {
    const drive = profile.configuration.drivetrain;
    assert.equal(drive.wheelRadiusM, .32); assert.equal(drive.gears.length, 6);
    assert.ok(drive.final_drive > 3 && drive.final_drive < 5);
    assert.ok(drive.gears[0] > 3 && drive.gears[0] < 5);
    for (let index = 1; index < drive.gears.length; index++) assert.ok(drive.gears[index] < drive.gears[index - 1]);
    const expected = 80 * 1000 / (60 * 2 * Math.PI * .32) * drive.gears[3] * drive.final_drive;
    assert.ok(Math.abs(virtualRpm(80, 4, drive) - expected) < 1e-8);
    assert.ok(Math.abs(virtualRpm(100, 4, drive) / virtualRpm(50, 4, drive) - 2) < 1e-12);
  }
});

test("20/30/40 km/h stay calm under cruise and maximum inferred demand for every road profile", () => {
  for (const profile of roads) for (const speed of [20, 30, 40]) for (const load of [0, .2, .55, 1]) {
    const rpm = rpmAt(speed, load, profile);
    assert.ok(rpm >= 1000 && rpm <= 3000, `${profile.id} ${speed} km/h load ${load}: ${rpm} RPM`);
  }
});

test("the normal 80 km/h road voice is already strong and rises at 100 and 130", () => {
  for (const profile of roads) {
    const values = [80, 100, 130].map(speed => rpmAt(speed, .25, profile));
    const minimum = profile.id === "otto" ? 3000 : 3500;
    assert.ok(values[0] >= minimum && values[0] <= 4500, `${profile.id}: ${values}`);
    assert.ok(values[1] > values[0] && values[2] > values[1], `${profile.id}: ${values}`);
    assert.ok(values[2] < profile.configuration.engine.limiter * .8);
  }
});

test("load holds a road gear longer without raising the city shift points to redline", () => {
  for (const profile of roads) {
    for (let gear = 1; gear <= 5; gear++) {
      const calm = roadUpshiftSpeed(gear, .2, profile), pulling = roadUpshiftSpeed(gear, 1, profile);
      assert.ok(pulling > calm); assert.ok(pulling <= 130);
      const between = (calm + pulling) / 2;
      assert.equal(choose(profile, { gear, speedKmh: between, drive: .2 })?.reason, "upshift");
      assert.equal(choose(profile, { gear, speedKmh: between, drive: 1 }), null);
    }
    assert.ok(roadUpshiftSpeed(1, 1, profile) <= 22);
    assert.ok(roadUpshiftSpeed(2, 1, profile) <= 40);
  }
});

test("initial road selection avoids first-gear flare after loading or GPS reacquisition at speed", () => {
  for (const profile of roads) for (const speed of [40, 80, 100, 130]) for (const load of [.2, 1]) {
    const gear = selectRoadGear(speed, load, profile);
    assert.ok(gear >= 3);
    assert.equal(choose(profile, { gear, speedKmh: speed, drive: load }), null);
    assert.ok(virtualRpm(speed, gear, profile.configuration.drivetrain) < profile.configuration.engine.limiter * .8);
  }
});

test("ascending and descending road journeys retain coherent sequential gears without overrev", () => {
  for (const profile of roads) for (const load of [.2, 1]) {
    let gear = 1, lastShift = -2, at = 0;
    const events = [];
    const step = (speedKmh, demand = load) => {
      at += .05;
      const decision = choose(profile, { gear, speedKmh, drive: demand, heldSeconds: at - lastShift });
      if (decision) {
        assert.equal(Math.abs(decision.gear - gear), 1);
        assert.ok(at - lastShift >= 1.1);
        gear = decision.gear; lastShift = at; events.push({ gear, speedKmh, reason: decision.reason });
      }
      const rpm = virtualRpm(speedKmh, gear, profile.configuration.drivetrain);
      assert.ok(rpm < profile.configuration.engine.limiter * .9, `${profile.id} ${speedKmh} km/h in ${gear}: ${rpm}`);
      if (speedKmh <= 40) assert.ok(rpm <= 3700);
    };
    for (let tick = 0; tick <= 1000; tick++) step(tick * .13);
    assert.equal(gear, 6);
    assert.equal(events.length, 5);
    for (let tick = 1000; tick >= 0; tick--) step(tick * .13, 0);
    assert.equal(gear, 1);
    assert.equal(events.length, 10);
    assert.ok(events.slice(0, 5).every(event => event.reason === "upshift"));
    assert.ok(events.slice(5).every(event => event.reason === "downshift"));
  }
});

test("speed and demand jitter around each shift boundary cannot hunt between gears", () => {
  for (const profile of roads) for (let boundary = 0; boundary < 5; boundary++) {
    let gear = boundary + 1, at = 0, lastShift = -2, count = 0;
    for (let tick = 0; tick < 240; tick++) {
      at += .1;
      const speedKmh = profile.upshiftKmh[boundary] + (tick % 2 ? 1 : -1);
      const decision = choose(profile, { gear, speedKmh, drive: tick % 3 ? .2 : 1, heldSeconds: at - lastShift });
      if (decision) { count++; gear = decision.gear; lastShift = at; }
    }
    assert.equal(count, 1, `${profile.id} boundary ${boundary}: ${count} changes`);
    assert.equal(gear, boundary + 2);
  }
});

test("kickdown has headroom against even the earliest upshift and never agitates city cruise", () => {
  for (const profile of roads) {
    const result = choose(profile, { gear: 5, speedKmh: 85, drive: 1 });
    assert.equal(result?.gear, 4); assert.equal(result?.reason, "kickdown");
    for (const load of [0, .2, .85, 1]) assert.equal(choose(profile, { gear: 4, speedKmh: 85, drive: load }), null);
    for (const speed of [20, 30, 40]) {
      const gear = selectRoadGear(speed, .2, profile);
      const decision = choose(profile, { gear, speedKmh: speed, drive: 1 });
      assert.notEqual(decision?.reason, "kickdown");
    }
  }
});

test("130 km/h is the shared ceiling for pitch, initial selection and every automatic decision", () => {
  assert.equal(ENGINE_ROAD_SPEED_CEILING_KMH, 130);
  for (const speed of [130, 131, 160, 260, 10000]) assert.equal(engineRoadSpeed(speed), 130);
  for (const speed of [NaN, Infinity, -Infinity, null, -1]) assert.equal(engineRoadSpeed(speed), 0);
  for (const profile of roads) for (const load of [0, .2, 1]) {
    assert.equal(selectRoadGear(130, load, profile), 6);
    for (const speed of [131, 160, 260]) {
      assert.equal(selectRoadGear(speed, load, profile), 6);
      for (let gear = 1; gear <= 6; gear++) {
        assert.equal(virtualRpm(speed, gear, profile.configuration.drivetrain), virtualRpm(130, gear, profile.configuration.drivetrain));
        assert.deepEqual(choose(profile, { gear, speedKmh: speed, drive: load }), choose(profile, { gear, speedKmh: 130, drive: load }));
      }
    }
  }
});

test("stale evidence, insufficient dwell and single-speed Turbine cannot produce automatic shifts", () => {
  for (const profile of roads) {
    assert.equal(choose(profile, { gear: 1, speedKmh: 80, canShift: false }), null);
    assert.equal(choose(profile, { gear: 1, speedKmh: 80, heldSeconds: 1.09 }), null);
    assert.equal(choose(profile, { gear: 1, speedKmh: 80, heldSeconds: NaN }), null);
    for (const speedKmh of [null, NaN, Infinity, -1]) assert.equal(choose(profile, { gear: 4, speedKmh }), null);
  }
  const turbine = ENGINE_PROFILES.find(profile => profile.singleSpeed);
  for (const speed of [0, 20, 80, 130, 260]) {
    assert.equal(selectRoadGear(speed, 1, turbine), 1);
    assert.equal(choose(turbine, { gear: 1, speedKmh: speed, drive: 1 }), null);
  }
});


test("city arrival and return use second gear at 30 without high RPM", () => {
  for (const profile of roads) {
    for (const load of [0, .2, .55, 1]) assert.equal(selectRoadGear(30, load, profile), 2);
    assert.ok(virtualRpm(30, 2, profile.configuration.drivetrain) <= 2800);
    assert.ok(roadUpshiftSpeed(2, 0, profile) >= 36);
    // Otto may retain third at exactly 30 on coast; its next downshift is 29.
    const decision = choose(profile, { gear: 3, speedKmh: 28, drive: 0 });
    assert.equal(decision?.gear, 2);
  }
});
