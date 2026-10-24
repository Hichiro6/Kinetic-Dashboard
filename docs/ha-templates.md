# Home Assistant Templates

This document describes a Home Assistant **Developer Tools → Template** that
lists every entity the Kinetic Dashboard expects, grouped by domain, so you
can quickly verify your HA instance exposes the same `entity_id` patterns
that `config.example.js` (and the adapter's `aliases` map) reference.

The template is pure Jinja2 — paste it into **Developer Tools → Template** and
the result will be a Markdown table you can scan.

## Template (Jinja2)

```jinja
{% set domains = [
  "alarm_control_panel",
  "automation",
  "binary_sensor",
  "calendar",
  "camera",
  "climate",
  "cover",
  "fan",
  "group",
  "input_boolean",
  "input_text",
  "light",
  "media_player",
  "select",
  "sensor",
  "switch",
  "weather",
] %}
# Entities expected by Kinetic Dashboard

| Domain | Count | entity_id |
| --- | ---: | --- |
{% for d in domains -%}
| `{{ d }}` | {{ states | selectattr('entity_id', 'search', d ~ '\\.') | list | count }} | {%- for s in (states | selectattr('entity_id', 'search', d ~ '\\.') | sort(attribute='entity_id')) | map(attribute='entity_id') | list %} `{{ s }}` {%- if not loop.last %}<br>{%- endif %} {%- endfor %} |
{% endfor %}
```

## Entity-id formats observed in `config.example.js`

The dashboard engine (and the example config) uses the following
`entity_id` patterns. If your HA setup uses different names, either rename
the entities in HA **or** add an entry to `CONFIG.aliases` in your
`config.js` so the adapter rewrites the IDs at load time.

| Domain | Example pattern | Purpose |
| --- | --- | --- |
| `alarm_control_panel` | `alarm_control_panel.<area>_alarm` | Alarm tile / siren |
| `automation` | `automation.<area>_<event>_notification` | Notifications popup triggers |
| `binary_sensor` | `binary_sensor.<area>_<contact|motion|presence|leak|rain|window>` | Doors, windows, motion, presence, leak, rain |
| `calendar` | `calendar.<name>` | Calendar tiles |
| `camera` | `camera.<location>` | Camera grid + fullscreen + playback |
| `climate` | `climate.<area>` | Climate / HVAC tiles |
| `cover` | `cover.<area>_curtain_<side>` | Curtain tiles |
| `fan` | `fan.<area>_fan` | Fan tiles / bathroom extractor |
| `group` | `group.all_<thing>s` | Aggregate groups (lights, curtains, fans, taps, windows, external doors) |
| `input_boolean` | `input_boolean.<area>_<flag>` | Toggles (auto-climate, movie mode, siren) |
| `input_text` | `input_text.dashboard_access` | Access codes for the access page |
| `light` | `light.<area>_lights`, `light.<area>_<name>` | Light tiles |
| `media_player` | `media_player.<area>_speaker` | Now-playing / media tiles |
| `select` | `select.<area>_<thing>_speed` | Fan-speed / rangehood select |
| `sensor` | `sensor.<area>_<measurement>`, `sensor.average_<zone>_soil_<metric>`, `sensor.<area>_<temp|humidity>` | Temperatures, humidity, soil moisture/temperature, tap flow, air quality, low-battery count |
| `switch` | `switch.<area>_<thing>` | Switch tiles (irrigation valves, etc.) |
| `weather` | `weather.<home>` | Weather forecast + animation |

## Notes

- The template above uses `states | selectattr('entity_id', 'search', ...)`
  which requires **Home Assistant 2023.4 or newer** (the `selectattr` filter
  on entity state objects was hardened then).
- `<area>` is a placeholder for any room/zone name you use in HA (`living`,
  `master`, `kids`, `office`, `backyard`, `driveway`, `garage`, `patio`, …).
- Anything the template lists as `0` for a domain means you have **no
  entities of that domain** in HA — the dashboard will simply skip the
  related tiles, but `00-config-adapter.js` will log a missing-key note so
  you can decide whether to add the integration.
- Aliases (`CONFIG.aliases`) take precedence over entity renaming: prefer
  aliases when you want to keep a stable engine-facing ID.