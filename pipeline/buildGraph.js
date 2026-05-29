/**
 * buildGraph.js
 * 
 * Pipeline script to build a Neo4j graph of TfL tube stations and their connections.
 * 
 * Steps:
 * 1. Fetch all tube lines from TfL API.
 * 2. Build station nodes and edges (relationships) from routes.
 * 3. Insert stations into Neo4j with uniqueness constraints.
 * 4. Insert edges between stations into Neo4j.
 */

import { buildFromRoutes } from "../data/buildFromRoutes.js";
import { fetchAllLines } from "../data/fetchAllLines.js";
import { insertStations } from "../db/insertStations.js";
import { insertEdges } from "../db/insertEdges.js";
import { createStationConstraint } from "../db/createConstraints.js";
import { importTravelTimes } from "../db/importTravelTimes.js";

async function main() {
    try {
        console.log("Fetching all tube lines from TfL...");
        const lines = await fetchAllLines(); // Array of line objects {id, name}
        console.log(`Found ${lines.length} lines`);

        console.log("Building graph from routes...");
        // buildFromRoutes returns { stations: [], edges: [] }
        const { stations, edges } = await buildFromRoutes(lines);

        console.log(`Stations: ${stations.length}`);
        console.log(`Edges: ${edges.length}`);

        // Ensure uniqueness constraint exists before inserting stations.
        console.log("Ensuring station uniqueness constraint...");
        await createStationConstraint();

        // Insert station nodes into Neo4j
        console.log("Inserting stations into database...");
        await insertStations(stations);
        console.log("Stations inserted.");

        // Insert relationships between stations
        console.log("Inserting edges (connections) into database...");
        await insertEdges(edges);
        console.log("Edges inserted.");

        console.log("Importing travel times from CSV...");
        await importTravelTimes();
        console.log("Travel times imported.");

        console.log("Graph build complete.");
    } catch (err) {
        console.error("Error building graph:", err);
        process.exit(1); // Exit with failure code
    } finally {
        // Ensure process exits cleanly even if driver or sessions remain open
        process.exit(0);
    }
}

// Run the pipeline
await main();
