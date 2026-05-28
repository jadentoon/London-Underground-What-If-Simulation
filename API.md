# TfL What-If Simulator — API Reference

This document covers every API surface in the project: the two internal HTTP endpoints exposed by the Next.js app, the external TfL Unified API endpoints the frontend calls directly, the internal library functions, the React hooks, and the data-pipeline utilities used to seed Neo4j.

---

## Table of Contents

1. [Internal HTTP API Routes](#1-internal-http-api-routes)
   - [GET /api/stations](#get-apistations)
   - [GET /api/trains/live](#get-apitrainslive)
2. [External TfL API Endpoints](#2-external-tfl-api-endpoints)
   - [Line Status](#line-status)
   - [Line Delays](#line-delays)
   - [Station Disruptions](#station-disruptions)
   - [Arrivals (proxied)](#arrivals-proxied)
3. [Internal Library Functions](#3-internal-library-functions)
   - [graph.js — buildGraph](#graphjs--buildgraph)
   - [pathfinding.js — dijkstra](#pathfindingjs--dijkstra)
   - [liveTrainFeedService.js — getLiveTrainFeed](#livetrainfeedservicejs--getlivetrainfeed)
   - [trainSnapshotBuilder.js — buildLiveSnapshots](#trainsnapshotbuilderjs--buildlivesnapshots)
   - [trainSnapshotBuilder.js — mergeLiveSnapshots](#trainsnapshotbuilderjs--mergelivesnapshots)
   - [trainPositionBuilders.js — buildFallbackTemplates](#trainpositionbuildersjs--buildfallbacktemplates)
   - [trainPositionBuilders.js — buildLiveTrainPositions](#trainpositionbuildersjs--buildlivetrainpositions)
   - [trainPositionBuilders.js — buildFallbackTrainPositions](#trainpositionbuildersjs--buildfallbacktrainpositions)
4. [React Hooks](#4-react-hooks)
   - [useTrainMovements](#usetrainmovements)
   - [useRoutePanel](#useroutepanel)
   - [useLiveStationClosures](#useLiveStationClosures)
   - [useWhatIfClosures](#usewhatifclosures)
   - [useLineDelays](#uselinedelays)
   - [useLineStatus](#uselinestatus)
5. [Data Pipeline Utilities](#5-data-pipeline-utilities)
   - [tFlClient.js — fetchTfl](#tflclientjs--fetchtfl)
   - [fetchAllLines](#fetchalllines)
   - [buildFromRoutes](#buildfromroutes)
   - [Neo4j DB helpers](#neo4j-db-helpers)
6. [Constants Reference](#6-constants-reference)
   - [Supported Lines](#supported-lines)
   - [Animation & Polling Constants](#animation--polling-constants)

---

## 1. Internal HTTP API Routes

The Next.js app exposes two server-side API routes under `app/api/`.

---

### GET /api/stations

**File:** `frontend/tfl-what-if-simulation/app/api/stations/route.js`

Returns the full station graph — all station nodes and their directed connections — as read from Neo4j. Results are cached in-process for one hour to avoid repeated database queries.

#### Request

```
GET /api/stations
```

No query parameters or request body required.

#### Response — 200 OK

```json
{
  "nodes": [
    {
      "id": "940GZZLUASL",
      "name": "Arsenal",
      "lat": 51.5586,
      "lon": -0.1059
    }
  ],
  "edges": [
    {
      "from": "940GZZLUASL",
      "to": "940GZZLUFPK",
      "line": "piccadilly",
      "travel_time": 90
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `nodes` | `Array<Node>` | Deduplicated list of all station nodes. |
| `nodes[].id` | `string` | NaPTAN station ID (e.g. `940GZZLUASL`). |
| `nodes[].name` | `string` | Human-readable station name. |
| `nodes[].lat` | `number` | WGS-84 latitude. |
| `nodes[].lon` | `number` | WGS-84 longitude. |
| `edges` | `Array<Edge>` | Directed connections between stations. Each edge is stored once per direction in Neo4j; the front-end treats the graph as undirected. |
| `edges[].from` | `string` | Source station NaPTAN ID. |
| `edges[].to` | `string` | Destination station NaPTAN ID. |
| `edges[].line` | `string` | TfL line identifier (e.g. `"piccadilly"`). |
| `edges[].travel_time` | `number` | Journey time in seconds between the two stations on this line. |

#### Response — 500 Internal Server Error

```json
{ "error": "Failed to fetch stations" }
```

Returned when the Neo4j query fails. The raw error is logged server-side.

#### Caching

The response is cached in-process for **60 minutes** (`STATION_GRAPH_CACHE_MS = 3_600_000 ms`). Subsequent requests within the cache window return a `X-Station-Graph-Cache: HIT` header; the first request (or after expiry) returns `X-Station-Graph-Cache: MISS`.

HTTP cache headers sent with every response:

```
Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400
```

---

### GET /api/trains/live

**File:** `frontend/tfl-what-if-simulation/app/api/trains/live/route.js`

Proxies the TfL Arrivals API for one or more tube lines, normalises the response, and splits predictions into trackable and untrackable buckets.

This proxy exists so the TfL API key is never exposed to the browser and so the front-end has a single endpoint to poll.

#### Request

```
GET /api/trains/live?lineIds=northern,central,victoria
```

| Query parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `lineIds` | `string` | No | All 11 supported lines | Comma-separated list of TfL line IDs to fetch arrivals for (e.g. `northern,victoria`). Invalid or blank entries are silently dropped. |

#### Response — 200 OK

```json
{
  "arrivals": [ ... ],
  "trackableArrivals": [ ... ],
  "untrackableArrivals": [ ... ],
  "meta": {
    "fetchedAt": "2025-05-27T10:30:00.000Z",
    "requestedLineIds": ["northern", "victoria"],
    "rawArrivalCount": 412,
    "trackableArrivalCount": 389,
    "trackableTrainCount": 87,
    "untrackableArrivalCount": 23
  }
}
```

| Field | Type | Description |
|---|---|---|
| `arrivals` | `Array` | All raw TfL arrival predictions exactly as returned by the TfL API. |
| `trackableArrivals` | `Array` | Predictions that have a non-empty, non-`"000"` `vehicleId` and can be placed on the map. |
| `untrackableArrivals` | `Array` | Predictions that lack a usable vehicle ID (ghost trains, engineering vehicles, etc.). |
| `meta.fetchedAt` | `string` | ISO-8601 timestamp of when the upstream TfL fetch completed. |
| `meta.requestedLineIds` | `string[]` | The resolved, normalised line IDs that were actually fetched. |
| `meta.rawArrivalCount` | `number` | Total predictions returned by TfL. |
| `meta.trackableArrivalCount` | `number` | Count of trackable predictions. |
| `meta.trackableTrainCount` | `number` | Distinct `lineId|vehicleId` pairs — the number of individual trains. |
| `meta.untrackableArrivalCount` | `number` | Count of predictions with no usable vehicle ID. |

Each object in `arrivals` / `trackableArrivals` / `untrackableArrivals` is a raw TfL `ArrivalPrediction` object. Key fields used by the front-end:

| TfL field | Type | Used for |
|---|---|---|
| `vehicleId` | `string` | Unique train identifier. |
| `lineId` | `string` | Line identifier. |
| `naptanId` | `string` | Destination stop NaPTAN ID. |
| `timeToStation` | `number` | Seconds until arrival (TfL estimate). |
| `expectedArrival` | `string` | ISO-8601 expected arrival time (used in preference to `timeToStation`). |
| `currentLocation` | `string` | Human-readable in-transit location string from TfL. |
| `towards` | `string` | Direction / destination name. |
| `platformName` | `string` | Platform identifier. |
| `destinationName` | `string` | Final destination name. |

#### Response — 502 Bad Gateway

```json
{ "error": "Failed to fetch live train feed" }
```

Returned when the upstream TfL Arrivals API call fails (network error, non-2xx response, etc.).

---

## 2. External TfL API Endpoints

The front-end calls these TfL endpoints directly from the browser (no proxy). No API key is required for read-only status and disruption endpoints; the arrivals endpoint is accessed via the `/api/trains/live` proxy.

---

### Line Status

**Used by:** `useLineStatus` hook  
**URL:** `https://api.tfl.gov.uk/Line/Mode/tube/Status?detail=true`  
**Method:** `GET`  
**Poll interval:** 15 seconds

Returns status information for all tube lines. The `?detail=true` parameter includes affected stop data for partial closures.

Key response fields consumed by the app:

| Field | Description |
|---|---|
| `[].id` | TfL line ID (e.g. `"northern"`). |
| `[].name` | Human-readable line name. |
| `[].lineStatuses[0].statusSeverity` | Numeric severity (lower = worse; ≤ 2 = closed, ≤ 5 = partial). |
| `[].lineStatuses[0].statusSeverityDescription` | Text description (e.g. `"Good Service"`, `"Minor Delays"`). |
| `[].lineStatuses[0].reason` | Free-text reason for disruption. |
| `[].lineStatuses[0].disruption.affectedStops` | Array of stop objects affected by partial closures. |

---

### Line Delays

**Used by:** `useLineDelays` hook  
**URL:** `https://api.tfl.gov.uk/Line/Mode/tube/Status`  
**Method:** `GET`  
**Poll interval:** 60 seconds (configurable via `pollMs`)

Returns current status for all tube lines. Produces a `Map<lineId, DelayInfo>` used to colour line overlays.

| DelayInfo field | Type | Description |
|---|---|---|
| `severity` | `number` | TfL severity value (default `10` = Good Service). |
| `description` | `string` | Severity description text. |
| `reason` | `string \| null` | Free-text disruption reason. |
| `fullDescription` | `string \| null` | Full disruption description from `disruption.description`. |
| `additionalInfo` | `string \| null` | Any additional info from `disruption.additionalInfo`. |

---

### Station Disruptions

**Used by:** `useLiveStationClosures` hook  
**URL:** `https://api.tfl.gov.uk/StopPoint/Mode/tube/Disruption`  
**Method:** `GET`  
**Poll interval:** 15 seconds (configurable via `pollMs`)

Returns a list of disruption objects for all tube stop points. The hook extracts the set of affected station IDs from `affectedStops`, `affectedStopPoints`, and `stopPointIds` fields.

Returns a `Set<string>` of NaPTAN station IDs that are currently closed or disrupted.

---

### Arrivals (proxied)

**Used by:** `liveTrainFeedService.js` (server-side)  
**URL:** `https://api.tfl.gov.uk/Line/{lineIds}/Arrivals`  
**Method:** `GET`

The TfL Arrivals endpoint accepts a comma-separated list of line IDs. This is called server-side from `/api/trains/live` so the request never reaches the browser. The full response is an array of `ArrivalPrediction` objects (see the `/api/trains/live` section for field details).

---

## 3. Internal Library Functions

### graph.js — buildGraph

**File:** `frontend/tfl-what-if-simulation/app/lib/graph.js`

Converts flat node and edge arrays from the `/api/stations` response into an adjacency-list graph suitable for pathfinding.

```js
import { buildGraph } from "@/app/lib/graph.js";

const graph = buildGraph(nodes, edges);
```

#### Parameters

| Parameter | Type | Description |
|---|---|---|
| `nodes` | `Array<{ id: string \| number, ... }>` | Station node objects. Only `id` is required. |
| `edges` | `Array<{ from, to, line, travel_time }>` | Directed edge objects from the API. |

#### Returns

```ts
Record<string, Array<{ to: string, weight: number, line: string }>>
```

A plain object keyed by station ID. Each value is an array of outbound edge descriptors. The graph is **undirected** — both directions are inserted for every edge.

```js
// Example output (simplified)
{
  "940GZZLUASL": [
    { to: "940GZZLUFPK", weight: 90, line: "piccadilly" },
    { to: "940GZZLUHBN", weight: 120, line: "piccadilly" }
  ],
  ...
}
```

Edges referencing unknown station IDs are silently skipped with a `console.warn`.

---

### pathfinding.js — dijkstra

**File:** `frontend/tfl-what-if-simulation/app/lib/pathfinding.js`

Dijkstra's shortest-path algorithm extended to support line-change penalties, closed stations, closed lines, and blocked edges. The graph is treated as undirected. A 5-minute penalty (`CHANGE_PENALTY_SECONDS = 300`) is applied whenever the optimal path switches between lines.

```js
import { dijkstra } from "@/app/lib/pathfinding.js";

const result = dijkstra(graph, startId, endId, closedStations, closedLines, blockedEdges);
```

#### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `graph` | `object` | Yes | Adjacency-list graph from `buildGraph`. |
| `start` | `string \| number` | Yes | NaPTAN ID of the origin station. |
| `end` | `string \| number` | Yes | NaPTAN ID of the destination station. |
| `closedStations` | `Set<string>` | No (default `new Set()`) | Station IDs to treat as closed. Closed stations are skipped during traversal; the destination is never skipped even if closed. |
| `closedLines` | `Set<string>` | No (default `new Set()`) | Line IDs whose edges are entirely excluded. |
| `blockedEdges` | `Set<string>` | No (default `new Set()`) | Specific undirected edges to block, formatted as `"fromId-toId-line"` (IDs sorted lexicographically). |

#### Returns

```ts
{
  path: string[];           // Ordered array of station NaPTAN IDs from start to end
  totalSeconds: number;     // Total journey time including line-change penalties
  changeCount: number;      // Number of line changes along the path
  statePath: string[];      // Internal key sequence (station__line) used for debugging
}
```

If no path exists (disconnected graph, all routes blocked), returns `{ path: [], totalSeconds: Infinity, changeCount: 0 }`.

---

### liveTrainFeedService.js — getLiveTrainFeed

**File:** `frontend/tfl-what-if-simulation/app/lib/trains/liveTrainFeedService.js`

Server-side function that fetches, validates and splits live arrival predictions from the TfL API. This is the underlying implementation of the `/api/trains/live` route.

```js
import { getLiveTrainFeed } from "@/app/lib/trains/liveTrainFeedService.js";

const feed = await getLiveTrainFeed({ lineIds: ["northern", "victoria"] });
```

#### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `lineIds` | `string[]` | No | Line IDs to request. Defaults to all 11 supported lines. Blank entries and duplicates are removed. |

#### Returns

Same shape as the `/api/trains/live` HTTP response (see above). Throws an `Error` if the upstream TfL request returns a non-2xx status.

---

### trainSnapshotBuilder.js — buildLiveSnapshots

**File:** `frontend/tfl-what-if-simulation/app/lib/trains/trainSnapshotBuilder.js`

Converts raw TfL arrival predictions into **train snapshots** — structured objects that capture a train's current edge, ETA and full upcoming stop queue at a given moment in time.

```js
import { buildLiveSnapshots } from "@/app/lib/trains/trainSnapshotBuilder.js";

const snapshots = buildLiveSnapshots({
  arrivals,
  nowMs,
  nodeById,
  stationNameToId,
  directedTravelTimeByLine,
  inboundByLineTo,
  edgesByLine,
});
```

#### Parameters

| Parameter | Type | Description |
|---|---|---|
| `arrivals` | `Array` | `trackableArrivals` from the live feed response. |
| `nowMs` | `number` | Current epoch time in milliseconds (`Date.now()`). |
| `nodeById` | `Map<string, Node>` | Station lookup built from `/api/stations` nodes. |
| `stationNameToId` | `Map<string, string>` | Normalised station name → NaPTAN ID, built by `buildStationNameIndex`. |
| `directedTravelTimeByLine` | `Map<string, number>` | Travel time lookup keyed as `"lineId|fromId|toId"`, built by `buildEdgeIndexes`. |
| `inboundByLineTo` | `Map<string, Array>` | Inbound edges keyed as `"lineId|toId"`, built by `buildEdgeIndexes`. |
| `edgesByLine` | `Map<string, Array>` | All edges grouped by line ID, built by `buildEdgeIndexes`. |

#### Returns

`Array<Snapshot>` where each snapshot describes a single physical train:

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique key `"lineId\|vehicleId"`. |
| `lineId` | `string` | TfL line ID. |
| `fromId` | `string` | Estimated origin station for the current segment. |
| `toId` | `string` | Next destination station. |
| `eta` | `number` | Seconds until arrival at `toId`. |
| `edgeTravelTime` | `number` | Total travel time of the current segment in seconds. |
| `stops` | `Array<StopEntry>` | Expanded upcoming stop queue (may include estimated intermediate stops). |
| `capturedAtMs` | `number` | Epoch ms at which this snapshot was built. |
| `vehicleId` | `string` | Raw TfL vehicle ID string. |
| `towards` | `string` | Destination / direction label from TfL. |
| `platformName` | `string` | Platform identifier. |
| `currentLocation` | `string` | In-transit location string from TfL. |
| `expectedArrival` | `string` | ISO-8601 expected arrival at `toId`. |
| `expectedArrivalMs` | `number` | Parsed epoch ms for `expectedArrival`. |
| `punctualityDeltaSeconds` | `number` | Seconds gained/lost versus previous snapshot (always `0` on first build). |

Snapshots are filtered to `MAX_LIVE_ETA_SECONDS` (480 s) and capped at `MAX_LIVE_TRAINS` (500) per call.

---

### trainSnapshotBuilder.js — mergeLiveSnapshots

**File:** `frontend/tfl-what-if-simulation/app/lib/trains/trainSnapshotBuilder.js`

Merges a freshly fetched snapshot array with the previously held snapshot array to produce smooth inter-poll animation. Prevents visible ETA jumps, preserves recently stale trains for up to `SNAPSHOT_CARRYOVER_MS` (180 s), and caps large ETA increases at +45 seconds per merge cycle.

```js
import { mergeLiveSnapshots } from "@/app/lib/trains/trainSnapshotBuilder.js";

const merged = mergeLiveSnapshots({
  previousSnapshots,
  nextSnapshots,
  nowMs,
  directedTravelTimeByLine,
});
```

#### Parameters

| Parameter | Type | Description |
|---|---|---|
| `previousSnapshots` | `Array<Snapshot>` | The last known snapshot array. |
| `nextSnapshots` | `Array<Snapshot>` | Newly fetched snapshots from `buildLiveSnapshots`. |
| `nowMs` | `number` | Current epoch time in milliseconds. |
| `directedTravelTimeByLine` | `Map<string, number>` | Edge travel time lookup (same as for `buildLiveSnapshots`). |

#### Returns

Merged `Array<Snapshot>`, sorted by ascending remaining ETA and capped at `MAX_LIVE_TRAINS` (500).

---

### trainPositionBuilders.js — buildFallbackTemplates

**File:** `frontend/tfl-what-if-simulation/app/lib/trains/trainPositionBuilders.js`

Produces deterministic animation templates for fallback (simulated) train movement. Called once when the graph loads; output is stable across renders.

```js
import { buildFallbackTemplates } from "@/app/lib/trains/trainPositionBuilders.js";

const templates = buildFallbackTemplates(edgesByLine);
```

#### Parameters

| Parameter | Type | Description |
|---|---|---|
| `edgesByLine` | `Map<string, Array>` | Edges grouped by line ID (from `buildEdgeIndexes`). |

#### Returns

`Array<FallbackTemplate>` — up to `FALLBACK_TRAINS_PER_LINE` (5) templates per line:

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Stable unique ID `"fallback-lineId-from-to"`. |
| `lineId` | `string` | TfL line ID. |
| `fromId` | `string` | Start station NaPTAN ID. |
| `toId` | `string` | End station NaPTAN ID. |
| `travelTime` | `number` | Segment travel time in seconds (minimum `MIN_EDGE_TRAVEL_TIME_SECONDS = 60`). |
| `phase` | `number` | Deterministic phase offset so trains are spread out on load. |

---

### trainPositionBuilders.js — buildLiveTrainPositions

**File:** `frontend/tfl-what-if-simulation/app/lib/trains/trainPositionBuilders.js`

Converts live snapshots into map marker objects by interpolating each train's current position along its active edge.

```js
import { buildLiveTrainPositions } from "@/app/lib/trains/trainPositionBuilders.js";

const trains = buildLiveTrainPositions(snapshots, nowMs, nodeById);
```

#### Parameters

| Parameter | Type | Description |
|---|---|---|
| `snapshots` | `Array<Snapshot>` | Current live snapshots (from `mergeLiveSnapshots`). |
| `nowMs` | `number` | Current epoch time in milliseconds. |
| `nodeById` | `Map<string, Node>` | Station lookup by NaPTAN ID. |

#### Returns

`Array<TrainMarker>`. Trains whose `fromNode` or `toNode` cannot be resolved are silently excluded.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Snapshot ID (`"lineId\|vehicleId"`). |
| `lineId` | `string` | TfL line ID. |
| `lat` | `number` | Interpolated WGS-84 latitude. |
| `lon` | `number` | Interpolated WGS-84 longitude. |
| `isLive` | `true` | Always `true` for live markers. |
| `label` | `string` | Human-readable line name. |
| `routeLabel` | `string` | `"From Station → To Station"`. |
| `fromName` | `string` | Origin station name. |
| `toName` | `string` | Destination station name. |
| `etaSeconds` | `number` | Seconds until arrival at next station. |
| `etaLabel` | `string` | Short formatted ETA string (e.g. `"2 min"`). |
| `nextArrivalTime` | `string` | ISO-8601 expected arrival time. |
| `towards` | `string` | Direction / final destination label. |
| `platformName` | `string` | Platform identifier. |
| `currentLocation` | `string` | In-transit location description. |
| `vehicleId` | `string` | TfL vehicle ID. |
| `punctualityState` | `string` | `"early"`, `"ontime"`, or `"late"`. |
| `punctualityLabel` | `string` | Human-readable punctuality description. |

---

### trainPositionBuilders.js — buildFallbackTrainPositions

**File:** `frontend/tfl-what-if-simulation/app/lib/trains/trainPositionBuilders.js`

Converts fallback templates into simulated map markers. Trains shuttle back and forth along their assigned edges using a deterministic time-based animation cycle.

```js
import { buildFallbackTrainPositions } from "@/app/lib/trains/trainPositionBuilders.js";

const trains = buildFallbackTrainPositions(templates, nowMs, nodeById);
```

#### Parameters

| Parameter | Type | Description |
|---|---|---|
| `templates` | `Array<FallbackTemplate>` | From `buildFallbackTemplates`. |
| `nowMs` | `number` | Current epoch time in milliseconds. |
| `nodeById` | `Map<string, Node>` | Station lookup by NaPTAN ID. |

#### Returns

`Array<TrainMarker>` with the same shape as `buildLiveTrainPositions`, except `isLive` is always `false`, `currentLocation` is `"Simulated fallback movement"`, `platformName` is `""`, and `punctualityState` is `"scheduled"`.

---

## 4. React Hooks

All hooks live under `frontend/tfl-what-if-simulation/app/hooks/`.

---

### useTrainMovements

**File:** `app/hooks/useTrainMovements.js`

The primary hook for map train data. Polls `/api/trains/live`, converts arrivals into animated markers, and falls back to simulated movement when the live feed is unavailable.

```js
const { trains, feedStatus } = useTrainMovements({ nodes, edges, enabled });
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `nodes` | `Array<Node>` | Yes | — | Station nodes from `/api/stations`. |
| `edges` | `Array<Edge>` | Yes | — | Graph edges from `/api/stations`. |
| `enabled` | `boolean` | No | `true` | Set to `false` in What-If mode to freeze live movement. |

#### Returns

| Field | Type | Description |
|---|---|---|
| `trains` | `Array<TrainMarker>` | Current train marker objects ready for map rendering. Updated every `ANIMATION_TICK_MS` (500 ms). |
| `feedStatus.source` | `"live" \| "fallback"` | Whether markers come from real TfL data or simulated movement. |
| `feedStatus.updatedAt` | `Date \| null` | When the live feed last updated successfully. |
| `feedStatus.reason` | `string` | Human-readable explanation when `source === "fallback"`. |
| `feedStatus.trainCount` | `number` | Number of active train markers. |

**Polling interval:** `LIVE_REFRESH_MS` (500,000 ms / ~8 min). The feed is refreshed immediately on mount.

---

### useRoutePanel

**File:** `app/hooks/map/useRoutePanel.js`

Manages the state of the route information panel shown after a successful path search.

```js
const {
  routingError,
  setRoutingError,
  routeInfo,
  isRoutePanelOpen,
  handleRouteChange,
  toggleRoutePanel,
  collapseRoutePanel,
  clearRoutePanel,
} = useRoutePanel();
```

#### Returns

| Field | Type | Description |
|---|---|---|
| `routingError` | `string \| null` | Error message to display in the routing error box. |
| `setRoutingError` | `(msg: string \| null) => void` | Setter for routing errors. |
| `routeInfo` | `object \| null` | Route result data (passed in via `handleRouteChange`). |
| `isRoutePanelOpen` | `boolean` | Whether the route info panel is currently visible. |
| `handleRouteChange` | `(info: object \| null) => void` | Called when a new route is computed. Automatically opens the panel if `info.hasPath` is truthy. |
| `toggleRoutePanel` | `() => void` | Toggles panel open/closed. |
| `collapseRoutePanel` | `() => void` | Forces the panel closed without clearing route data. |
| `clearRoutePanel` | `() => void` | Resets all route state and closes the panel. |

---

### useLiveStationClosures

**File:** `app/hooks/map/useLiveStationClosures.js`

Polls the TfL StopPoint Disruption API and returns the set of currently disrupted station IDs.

```js
const liveClosedStations = useLiveStationClosures({ enabled, pollMs });
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `enabled` | `boolean` | Yes | — | Pass `false` to stop polling and return an empty set (e.g. in What-If mode). |
| `pollMs` | `number` | No | `15000` | How often (in milliseconds) to re-fetch disruption data. |

#### Returns

`Set<string>` — NaPTAN station IDs currently flagged as disrupted by TfL. Returns an empty set when `enabled` is `false` or the API call fails.

---

### useWhatIfClosures

**File:** `app/hooks/map/useWhatIfClosures.js`

Manages hypothetical station and line closures set by the user in What-If mode.

```js
const {
  closedStations,
  closedLines,
  toggleClosedStation,
  handleLineToggle,
  handleResetClosures,
  clearClosedStations,
  clearClosedLines,
} = useWhatIfClosures(hypotheticalSettingsEnabled);
```

#### Parameters

| Parameter | Type | Description |
|---|---|---|
| `hypotheticalSettingsEnabled` | `boolean` | When `false`, all toggle/reset actions are no-ops. |

#### Returns

| Field | Type | Description |
|---|---|---|
| `closedStations` | `Set<string>` | Station IDs the user has marked as closed. |
| `closedLines` | `Set<string>` | Line IDs the user has marked as closed. |
| `toggleClosedStation` | `(stationId: string) => void` | Adds or removes a station from the closed set. |
| `handleLineToggle` | `(lineId: string) => void` | Adds or removes a line from the closed set. |
| `handleResetClosures` | `() => void` | Clears all user-defined closures (both stations and lines). |
| `clearClosedStations` | `() => void` | Clears only the stations set. |
| `clearClosedLines` | `() => void` | Clears only the lines set. |

---

### useLineDelays

**File:** `app/hooks/map/useLineDelays.js`

Polls the TfL Line Status API and returns a map of delay information per line.

```js
const lineDelays = useLineDelays({ pollMs });
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `pollMs` | `number` | No | `60000` | Poll interval in milliseconds. |

#### Returns

`Map<string, DelayInfo>` keyed by TfL line ID.

| DelayInfo field | Type | Description |
|---|---|---|
| `severity` | `number` | TfL severity value (10 = Good Service). |
| `description` | `string` | Severity label. |
| `reason` | `string \| null` | Disruption reason text. |
| `fullDescription` | `string \| null` | Full disruption text from TfL. |
| `additionalInfo` | `string \| null` | Extra info if provided by TfL. |

---

### useLineStatus

**File:** `app/hooks/useLineStatus.js`

The most comprehensive line-status hook. Fetches live TfL line status, classifies each line as `open`, `partial`, or `closed`, and computes the merged "effective" state that accounts for What-If mode overrides.

```js
const {
  effectiveLines,
  effectiveClosedLines,
  effectivePartialLines,
  effectivePartialStationIdsByLine,
  isLiveLines,
  linesUpdatedAt,
  linesSource,
  linesReason,
  liveClosedCount,
  livePartialCount,
  lineStatusLabel,
  lineStatusColor,
  lineStatusBg,
} = useLineStatus({ hypotheticalSettingsEnabled, simulatedClosedLines, pollMs });
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `hypotheticalSettingsEnabled` | `boolean` | Yes | — | When `true`, live status is suppressed and simulated closures take precedence. |
| `simulatedClosedLines` | `Set<string>` | No | `new Set()` | User-defined line closures from `useWhatIfClosures`. Only applied when `hypotheticalSettingsEnabled` is `true`. |
| `pollMs` | `number` | No | `15000` | How often to re-fetch live status. |

#### Returns

| Field | Type | Description |
|---|---|---|
| `effectiveLines` | `Array<LineOption>` | The line list to display — live data in normal mode, static fallback in What-If mode. Each entry has `{ id, label, color }`. |
| `effectiveClosedLines` | `Set<string>` | Authoritative closed line IDs for the current mode. |
| `effectivePartialLines` | `Set<string>` | Partially disrupted line IDs (only populated in live mode). |
| `effectivePartialStationIdsByLine` | `Map<string, Set<string>>` | Affected station IDs per partially disrupted line. |
| `isLiveLines` | `boolean` | `true` when live TfL data is loaded and What-If mode is off. |
| `linesUpdatedAt` | `Date \| null` | When live line status last successfully loaded. |
| `linesSource` | `"live" \| "fallback"` | Source of the line data. |
| `linesReason` | `string` | Explanation when `linesSource === "fallback"`. |
| `liveClosedCount` | `number` | Number of fully closed lines in the live feed. |
| `livePartialCount` | `number` | Number of partially disrupted lines in the live feed. |
| `lineStatusLabel` | `string` | Human-readable summary label for the HUD status badge. |
| `lineStatusColor` | `string` | Hex colour for the status badge (green/amber/red/orange). |
| `lineStatusBg` | `string` | RGBA background colour string for the status badge. |

---

## 5. Data Pipeline Utilities

These scripts are run locally (not in the Next.js app) to seed and update the Neo4j graph database.

---

### tFlClient.js — fetchTfl

**File:** `data/tFlClient.js`

Generic TfL API fetch helper used by the pipeline scripts. Requires `TFL_APP_KEY` in `.env`.

```js
import { fetchTfl } from "./data/tFlClient.js";

const data = await fetchTfl("/Line/Victoria/Route/Sequence/all");
```

#### Parameters

| Parameter | Type | Description |
|---|---|---|
| `endpoint` | `string` | TfL API path (e.g. `"/Line/Mode/tube"`). Do not include the base URL or `app_key`. |

#### Returns

Parsed JSON response. Throws an `Error` with message `"TfL API error"` on any non-2xx response.

---

### fetchAllLines

**File:** `data/fetchAllLines.js`

Fetches all tube line metadata from TfL.

```js
import { fetchAllLines } from "./data/fetchAllLines.js";

const lines = await fetchAllLines();
// [{ id: "northern", name: "Northern" }, ...]
```

#### Returns

`Array<{ id: string, name: string }>` — one entry per tube line.

---

### buildFromRoutes

**File:** `data/buildFromRoutes.js`

For each line, fetches the route sequence from TfL and builds station nodes and directed edges (with travel time data where available).

```js
import { buildFromRoutes } from "./data/buildFromRoutes.js";

const { stations, edges } = await buildFromRoutes(lines);
```

#### Parameters

| Parameter | Type | Description |
|---|---|---|
| `lines` | `Array<{ id, name }>` | Line objects from `fetchAllLines`. |

#### Returns

```ts
{
  stations: Array<{ id: string, name: string, lat: number, lon: number }>,
  edges: Array<{ from: string, to: string, line: string, travel_time: number }>
}
```

---

### Neo4j DB Helpers

**Files:** `db/insertStations.js`, `db/insertEdges.js`, `db/createConstraints.js`

All helpers use the shared driver from `db/neo4jClient.js` (Bolt on `localhost:7687`, credentials from `NEO4J_PASSWORD` env var).

| Function | File | Description |
|---|---|---|
| `createStationConstraint()` | `db/createConstraints.js` | Creates a Neo4j uniqueness constraint on `Station.id` if it doesn't already exist. Should be run before any inserts. |
| `insertStations(stations)` | `db/insertStations.js` | Upserts station nodes into Neo4j using `MERGE ON CREATE SET`. Accepts `Array<{ id, name, lat, lon }>`. |
| `insertEdges(edges)` | `db/insertEdges.js` | Upserts `CONNECTS_TO` relationships between stations. Accepts `Array<{ from, to, line, travel_time }>`. |

**Pipeline entry point:** `pipeline/buildGraph.js` — run with `node pipeline/buildGraph.js` from the project root. Fetches all lines, builds nodes and edges, applies constraints, and inserts everything into Neo4j in order.

---

## 6. Constants Reference

### Supported Lines

The following TfL line IDs are supported. Arrivals and graph data are fetched for all of them by default.

| ID | Display Name | Hex Colour |
|---|---|---|
| `bakerloo` | Bakerloo | `#B36305` |
| `central` | Central | `#E32017` |
| `circle` | Circle | `#FFD300` |
| `district` | District | `#00782A` |
| `hammersmith-city` | Hammersmith & City | `#F3A9BB` |
| `jubilee` | Jubilee | `#A0A5A9` |
| `metropolitan` | Metropolitan | `#9B0056` |
| `northern` | Northern | `#000000` |
| `piccadilly` | Piccadilly | `#003688` |
| `victoria` | Victoria | `#0098D4` |
| `waterloo-city` | Waterloo & City | `#95CDBA` |

### Animation & Polling Constants

Defined in `app/lib/trains/trainMovementConstants.js`:

| Constant | Value | Description |
|---|---|---|
| `LIVE_REFRESH_MS` | `500,000 ms` | Interval between live arrivals API polls (~8 min). |
| `ANIMATION_TICK_MS` | `500 ms` | React state clock tick for smooth train animation. |
| `MAX_LIVE_ETA_SECONDS` | `480 s` | Arrivals beyond this ETA are discarded from snapshots. |
| `MAX_ROUTE_ETA_SECONDS` | `3600 s` | Hard cap used when parsing `expectedArrival` timestamps. |
| `MAX_LIVE_TRAINS` | `500` | Maximum number of simultaneously animated live trains. |
| `FALLBACK_TRAINS_PER_LINE` | `5` | Simulated trains per line in fallback mode. |
| `MIN_EDGE_TRAVEL_TIME_SECONDS` | `60 s` | Floor applied to edge travel times to prevent division-by-zero in interpolation. |
| `SNAPSHOT_CARRYOVER_MS` | `180,000 ms` | How long a stale snapshot is kept alive after disappearing from the live feed. |
| `PUNCTUALITY_THRESHOLD_SECONDS` | `20 s` | Delta at which a train is considered early or late. |

Other constants:

| Constant | File | Value | Description |
|---|---|---|---|
| `CHANGE_PENALTY_SECONDS` | `pathfinding.js` | `300 s` | Added to journey time per line change in the Dijkstra search. |
| `STATION_GRAPH_CACHE_MS` | `api/stations/route.js` | `3,600,000 ms` | Server-side in-process cache TTL for the station graph. |
