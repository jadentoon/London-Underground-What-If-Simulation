/**
 * API route for loading the station graph used by the map.
 *
 * The route queries Neo4j for Station -> CONNECTS_TO -> Station relationships,
 * normalises duplicate station nodes, converts Neo4j integer values into plain
 * numbers and returns graph-friendly `{ nodes, edges }` data for the frontend.
 */
import { NextResponse } from "next/server";
import driver from "../../lib/neo4j.js";
import neo4j from "neo4j-driver";

const STATION_GRAPH_CACHE_MS = 60 * 60 * 1000;

let stationGraphCache = null;
let stationGraphCacheExpiresAt = 0;
let stationGraphRequestInFlight = null;

/**
 * Converts Neo4j numeric values into JavaScript numbers.
 *
 * Neo4j integer objects need explicit conversion before they can be safely
 * serialised into the API response.
 *
 * @param {number | Object} value - Native number or Neo4j integer-like value.
 * @returns {number} JavaScript numeric value.
 */
function toNumber(value) {
    if (typeof value === "number") {
        return value;
    }

    if (neo4j.isInt(value)) {
        return neo4j.integer.inSafeRange(value)
            ? value.toNumber()
            : Number(value.toString());
    }

    return Number(value);
}

/**
 * Loads the station graph directly from Neo4j.
 *
 * Station nodes are deduplicated by id while each relationship becomes one edge
 * in the response. The session is always closed in `finally` to avoid leaking
 * database connections.
 *
 * @returns {Promise<{ nodes: Array<Object>, edges: Array<Object> }>} Station graph data.
 */
async function loadStationGraphFromNeo4j() {
    const session = driver.session();

    try {
        const result = await session.run(`
            MATCH (s1:Station)-[r:CONNECTS_TO]->(s2:Station)
            RETURN
                s1.id AS fromId, s1.name AS fromName, s1.lat AS fromLat, s1.lon AS fromLon,
                s2.id AS toId, s2.name AS toName, s2.lat AS toLat, s2.lon AS toLon,
                r.line AS line,
                r.travel_time_seconds AS travel_time
        `);

        const nodesMap = new Map();

        const edges = [];

        result.records.forEach(record => {
            const fromId = record.get("fromId");
            const toId = record.get("toId");

            if (!nodesMap.has(fromId)) {
                nodesMap.set(fromId, {
                    id: fromId,
                    name: record.get("fromName"),
                    lat: record.get("fromLat"),
                    lon: record.get("fromLon")
                });
            }

            if (!nodesMap.has(toId)) {
                nodesMap.set(toId, {
                    id: toId,
                    name: record.get("toName"),
                    lat: record.get("toLat"),
                    lon: record.get("toLon")
                });
            }

            const travelTime = record.get("travel_time");

            edges.push({
                from: fromId,
                to: toId,
                line: record.get("line"),
                travel_time: toNumber(travelTime),
            });
        });

        const nodes = Array.from(nodesMap.values());

        return {
            nodes,
            edges,
        };
    } finally {
        await session.close();
    }
}

/**
 * Handles `GET /api/stations`.
 *
 * Responses are cached in memory to avoid repeatedly querying Neo4j while the
 * station graph is unchanged. Concurrent requests share the same in-flight
 * database query.
 *
 * @returns {Promise<import("next/server").NextResponse>} Station graph JSON response.
 */
export async function GET() {
    const now = Date.now();

    if (stationGraphCache && now < stationGraphCacheExpiresAt) {
        return NextResponse.json(stationGraphCache, {
            headers: {
                "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
                "X-Station-Graph-Cache": "HIT",
            },
        });
    }

    try {
        if(!stationGraphRequestInFlight) {
            stationGraphRequestInFlight = loadStationGraphFromNeo4j();
        }

        const graph = await stationGraphRequestInFlight;

        stationGraphCache = graph;
        stationGraphCacheExpiresAt = Date.now() + STATION_GRAPH_CACHE_MS;

        return NextResponse.json(graph, {
            headers: {
                "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
                "X-Station-Graph-Cache": "MISS",
            },
        });
    } catch (error) {
        console.error("Neo4j error: ", error);

        return NextResponse.json(
            { error: "Failed to fetch stations" },
            { status: 500 }
        );
    } finally {
        stationGraphRequestInFlight = null;
    }
}
