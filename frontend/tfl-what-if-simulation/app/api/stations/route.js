import { NextResponse } from "next/server";
import driver from "../../lib/neo4j.js";

export async function GET() {
    const session = driver.session();

    try {
        const result = await session.run(`
            MATCH (s:Station)
            RETURN
                s.name AS name,
                s.lat AS lat,
                s.lon AS lon
        `);

        const stations = result.records.map(r => ({
            name: r.get("name"),
            lat: r.get("lat"),
            lon: r.get("lon"),
        }));

        return NextResponse.json(stations);
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