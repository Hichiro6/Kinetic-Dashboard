// ===== CONFIG ADAPTER =====
// Runs BEFORE 01-config-and-access.js. It takes window.DASH_CONFIG as written by the user and
// normalizes it to the shape the engine expects, so a partial or older config.js never crashes the dashboard.
//   1. deep defaults   - missing nested keys are filled in (Object.assign in 01 is shallow)
//   2. type fixes      - null/wrong-type values are replaced by safe empty values
//   3. aliases         - CONFIG.aliases { "engine.entity_id": "your.entity_id" } rewrites every matching string
//   4. invariants      - e.g. one climate room must be flagged main:true
// Every fix is logged once in the console as  [config] ...  so you can clean up config.js later.
(function () {
  var C = window.DASH_CONFIG;
  if (!C || typeof C !== "object") return;   // 01 shows the "config not found" screen
  var notes = [];
  var note = function (m) { notes.push(m); };
  var isObj = function (v) { return v && typeof v === "object" && !Array.isArray(v); };

  // ---- 1 + 2. Deep defaults: [path, default value]. Arrays and objects are type-checked. ----
  var DEFAULTS = [
    ["icons", {}], ["calNames", {}], ["playback", {}], ["mediaArt", {}], ["tileTimers", {}], ["tileFx", {}], ["roomControls", {}],
    ["camControls", {}], ["garageAlert", {}], ["view", {}], ["relevance", {}], ["users", {}], ["entities", {}],
    ["lyricsFrom", []], ["notifTimers", []], ["activeAppliances", []], ["adminToggles", []], ["countIfNotOff", []],
    ["irrigation", []], ["cameras", []], ["security", []], ["calendars", []], ["media", []], ["alarmTiles", []],
    ["rooms", []], ["tiles", []], ["house", []], ["roomTabs", []], ["volcanoes", []], ["alerts", []], ["quickAll", []],
    ["leakSensors", []], ["noNameUsers", []],
    ["derived", {}], ["derived.houseTemps", []], ["derived.soil", {}], ["derived.groups", {}], ["derived.batteryBelow", 20],
    ["detections", {}], ["detections.snapshots", ""], ["detections.previewParallel", 0],
    ["entities.mbrCurtains", []],
    ["scenes", {}], ["scenes.groups", []], ["scenes.ri", []], ["scenes.rc", []], ["scenes.preset", []], ["scenes.gradient", []], ["scenes.rooms", []], ["scenes.lights", []],
    ["layout", {}], ["layout.tablet", ["status", "cams", "rooms", "forecast"]], ["layout.mobile", ["status", "nowplaying", "forecast"]],
    ["weatherFx", { speed: 0.5 }], ["hazards", { radius: 200, focusKm: 100, minMag: 4 }],
    ["rainSkipMm", 2], ["batteryDisplay", "kiosk"], ["siren", {}]
  ];
  DEFAULTS.forEach(function (d) {
    var keys = d[0].split("."), last = keys.pop(), o = C;
    for (var i = 0; i < keys.length; i++) { if (!isObj(o[keys[i]])) return; o = o[keys[i]]; }
    var v = o[last], want = d[1], copy = JSON.parse(JSON.stringify(want));
    if (v === undefined) { o[last] = copy; note(d[0] + " missing, using default"); return; }
    if (Array.isArray(want) && !Array.isArray(v)) { o[last] = copy; note(d[0] + " should be an array, got " + (v === null ? "null" : typeof v)); return; }
    if (isObj(want) && !isObj(v)) { o[last] = copy; note(d[0] + " should be an object, got " + (v === null ? "null" : typeof v)); return; }
  });

  // ---- 3. Aliases: rewrite engine entity IDs to the house's real ones, everywhere in the config. ----
  var A = isObj(C.aliases) ? C.aliases : {};
  if (Object.keys(A).length) {
    var walk = function (v) {
      if (typeof v === "string") return A[v] !== undefined ? A[v] : v.split(",").map(function (s) { return A[s] !== undefined ? A[s] : s; }).join(",");
      if (Array.isArray(v)) return v.map(walk);
      if (isObj(v)) { var o = {}; Object.keys(v).forEach(function (k) { o[A[k] !== undefined ? A[k] : k] = k === "aliases" ? v[k] : walk(v[k]); }); return o; }
      return v;
    };
    Object.keys(C).forEach(function (k) { if (k !== "aliases") C[k] = walk(C[k]); });
  }
  window.DASH_ALIAS = function (id) { return A[id] !== undefined ? A[id] : id; };   // for modules with hardcoded IDs

  // ---- 4. Invariants the engine relies on. ----
  // 04-state.js does CONFIG.rooms.filter(r => r.main)[0].id  -> crashes if no room has main:true.
  if (C.rooms.length && !C.rooms.some(function (r) { return r && r.main; })) { C.rooms[0].main = true; note("no room has main:true, using " + C.rooms[0].id); }
  if (!C.rooms.length) { C.rooms.push({ id: "unset.climate", name: "Heat pump", main: true }); note("rooms is empty, added a placeholder main room"); }
  C.house.forEach(function (h, i) { if (!h.id) { h.id = "room" + i; note("house[" + i + "] has no id"); } if (!Array.isArray(h.sections)) h.sections = []; if (!Array.isArray(h.occ)) h.occ = []; });
  C.irrigation = C.irrigation.filter(function (z, i) { var ok = isObj(z) && z.zone; if (!ok) note("irrigation[" + i + "] dropped (needs at least {name, zone})"); return ok; });
  if (C.houseAvg && !C.derived.houseTemps.length) note("houseAvg is set but derived.houseTemps is empty, the average will stay blank");

  if (notes.length) console.info("[config] adapter applied " + notes.length + " fix(es):\n - " + notes.join("\n - "));
})();
