import { driver } from "./neo4jClient.js";

/**
 * Inserts bidirectional CONNECTS_TO relationships between stations.
 * Each relationship is tagged with line id.
 * 
 * @param {Array} edges - [{ from, to, line, lineName }]
 */
export async function insertEdges(edges) {
    const session = driver.session();

    try {
        await session.run(
            `
            UNWIND $edges AS e
            MATCH (a:Station {id: e.from}), (b:Station {id: e.to})
            MERGE (a)-[:CONNECTS_TO {line: e.line}]->(b)
            MERGE (b)-[:CONNECTS_TO {line: e.line}]->(a)
            `,
            { edges }
        );
    } finally {
        await session.close();
    }
}