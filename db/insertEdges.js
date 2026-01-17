import { driver } from "./neo4jClient.js";

export async function insertEdges(edges) {
    const session = driver.session();

    for (const e of edges) {
        await session.run(
            `MATCH (a:Station {id:$from}), (b:Station {id:$to})
             MERGE (a)-[:CONNECTS_TO {line:$line}]->(b)
             MERGE (b)-[:CONNECTS_TO {line:$line}]->(a)`,
            e
        )
    }

    await session.close();
}