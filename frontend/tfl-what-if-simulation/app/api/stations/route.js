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

/**
 * GET /api/stations
 * 
 * @returns {JSON} {
 *  nodes: Array<{ id, name, lat, lon }>,
 *  edges: Array<{ from, to, line }>
 * }
 */
export async function GET() {
    // Create a new Neo4j session for this request.
    // Sessions are lightweight but MUST be closed after use.
    const session = driver.session();

    try {
        // Fetch all directed station connections.
        const result = await session.run(`
            MATCH (s1:Station)-[r:CONNECTS_TO]->(s2:Station)
            RETURN
                s1.id AS fromId, s1.name AS fromName, s1.lat AS fromLat, s1.lon AS fromLon,
                s2.id AS toId, s2.name AS toName, s2.lat AS toLat, s2.lon AS toLon,
                r.line AS line
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

            // Record the connection between stations.
            edges.push({
                from: fromId,
                to: toId,
                line: record.get("line")
            });
        });

        // Convert node map into an array for JSON serialisation.
        const nodes = Array.from(nodesMap.values());

        // Successful response.
        return NextResponse.json({
            nodes, 
            edges
        });
    } catch (error) {
        /**
         * Catch-all error handling:
         * - Logs internal error for debugging.
         * - Returns generic message to avoid leaking implementation details.
         */
        console.error("Neo4j error: ", error);

        return NextResponse.json(
            { error: "Failed to fetch stations" },
            { status: 500 }
        );
    } finally {
        /**
         * Always close the Neo4j session.
         * This runs regardless of success or failure and prevents
         * connection leaks under load.
         */
        await session.close();
    }
}