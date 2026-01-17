import { driver } from "./neo4jClient.js";

export async function insertStations (stations) {
    const session = driver.session();

    for (const s of stations) {
        await session.run(
            `MERGE (n:Station {id:$id})
             SET n.name=$name, n.lat=$lat, n.lon=$lon`,
            s
        );
    }

    await session.close();
}