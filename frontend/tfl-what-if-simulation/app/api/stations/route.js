import { NextResponse } from "next/server";
import driver from "../../lib/neo4j.js";

export async function GET() {
    const session = driver.session();

    try {
        const result = await session.run(`
            MATCH (s1:Station)-[r:CONNECTS_TO]->(s2:Station)
            RETURN
                s1.id AS fromId, s1.name AS fromName, s1.lat AS fromLat, s1.lon AS fromLon,
                s2.id AS toId, s2.name AS toName, s2.lat AS toLat, s2.lon AS toLon,
                r.line AS line
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

            edges.push({
                from: fromId,
                 to: toId,
                line: record.get("line")
            });
        });

        const nodes = Array.from(nodesMap.values());

        return NextResponse.json({
            nodes, 
            edges
        });
    } catch (error) {
        console.error("Neo4j error: ", error);
        return NextResponse.json(
            { error: "Failed to fetch stations" },
            { status: 500 }
        );
    } finally {
        await session.close();
    }
}