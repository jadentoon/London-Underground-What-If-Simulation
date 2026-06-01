import { driver } from "./neo4jClient.js";

/**
 * Ensures a uniqueness constraint for Station nodes in Neo4j.
 * 
 * Neo4j constraints help maintain data integrity and improve query performance.
 * In this case, we enforce that every Station node has a unique 'id' property.
 * This prevents accidentally inserting duplicate stations.
 */
export async function createStationConstraint() {
    const session = driver.session();

    try {
        // Run the constraint creation query
        // IF NOT EXISTS ensures it won't fail if the constraint already exists.
        await session.run(`
            CREATE CONSTRAINT station_id_unique IF NOT EXISTS
            FOR (s:Station)
            REQUIRE s.id IS UNIQUE
        `);

        console.log("Station constraint ensured.");
    } finally {
        await session.close();
    }
}