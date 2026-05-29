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
            WITH a, b, e,
                CASE
                    WHEN e.distance IS NULL THEN 60
                    WHEN e.distance / 12.0 < 60 THEN 60
                    ELSE toInteger(round(e.distance / 12.0))
                END AS fallbackTravelTime
            MERGE (a)-[forward:CONNECTS_TO {line: e.line}]->(b)
            SET forward.distance = e.distance,
                forward.travel_time_seconds = coalesce(forward.travel_time_seconds, fallbackTravelTime)
            MERGE (b)-[reverse:CONNECTS_TO {line: e.line}]->(a)
            SET reverse.distance = e.distance,
                reverse.travel_time_seconds = coalesce(reverse.travel_time_seconds, fallbackTravelTime)
            `,
            { edges }
        );
    } finally {
        await session.close();
    }
}
