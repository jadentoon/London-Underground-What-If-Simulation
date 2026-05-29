/**
 * API route for fetching station nodes and their connections from Neo4j.
 * 
 * This endpoint:
 * - Queries all Station -> Station Connections.
 * - Normalises stations into unique nodes.
 * - Returns a graph-friendly structure: { nodes, edges }.
 * 
 * Designed for front-end map visualisation.
 */
import { NextResponse } from "next/server";
import driver from "../../lib/neo4j.js";
import neo4j from "neo4j-driver";

const STATION_GRAPH_CACHE_MS = 60 * 60 * 1000;

let stationGraphCache = null;
let stationGraphCacheExpiresAt = 0;
let stationGraphRequestInFlight = null;

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

        /**
         * Map used to deduplicate station nodes.
         * Keyed by station id to ensure each station appears only once
         * even if it has many connections.
         */
        const nodesMap = new Map();

        /**
         * Edge list representing connections between stations.
         * Each edge corresponds to a CONNECTS_TO relationship.
         */
        const edges = [];

        // Transform Neo4j records into nodes + edges.
        result.records.forEach(record => {
            const fromId = record.get("fromId");
            const toId = record.get("toId");

            // Add source station if it hasn't been seen before.
            if (!nodesMap.has(fromId)) {
                nodesMap.set(fromId, {
                    id: fromId,
                    name: record.get("fromName"),
                    lat: record.get("fromLat"),
                    lon: record.get("fromLon")
                });
            }

            // Add destination station if it hasn't been seen before.
            if (!nodesMap.has(toId)) {
                nodesMap.set(toId, {
                    id: toId,
                    name: record.get("toName"),
                    lat: record.get("toLat"),
                    lon: record.get("toLon")
                });
            }

            const travelTime = record.get("travel_time");

            // Record the connection between stations.
            edges.push({
                from: fromId,
                to: toId,
                line: record.get("line"),
                travel_time: toNumber(travelTime),
            });
        });

        // Convert node map into an array for JSON serialisation.
        const nodes = Array.from(nodesMap.values());

        return {
            nodes,
            edges,
        };
    } finally {
        /**
         * Always close the Neo4j session.
         * This runs regardless of success or failure and prevents
         * connection leaks under load.
         */
        await session.close();
    }
}

/**
 * GET /api/stations
 * 
 * @returns {JSON} {
 *  nodes: Array<{ id, name, lat, lon }>,
 *  edges: Array<{ from, to, line }>
 * }
 */
export async function GET() {
    const now = Date.now();

    if (stationGraphCache && now < stationGraphCacheExpiresAt) {
        return NextResponse.json(stationGraphCache, {
            headers: {
                "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revaildate=86400",
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
                "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revaildate=86400",
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
