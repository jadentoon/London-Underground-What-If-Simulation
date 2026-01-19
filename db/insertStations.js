import { driver } from "./neo4jClient.js";

/**
 * Inserts station nodes into Neo4j.
 * Uses MERGE to avoid creating duplicate stations with the same id.
 * @param {Array} stations - Array of station objects:
 *      [{id, name, lat, lon}]
 */
export async function insertStations(stations) {
    const session = driver.session();

    try {
        await session.run(
            `
            UNWIND $stations AS s
            MERGE (n:Station {id: s.id})
            SET n.name = s.name, 
                n.lat = s.lat, 
                n.lon = s.lon
            `,
            { stations }
        );
    } finally {
        // Always close session even if an error occurs.
        await session.close();
    }
}