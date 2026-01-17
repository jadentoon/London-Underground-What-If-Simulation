import { buildFromRoutes } from "../data/buildFromRoutes.js";
import { fetchAllLines } from "../data/fetchAllLines.js";
import { insertStations } from "../db/insertStations.js";
import { insertEdges } from "../db/insertEdges.js";

const lines = await fetchAllLines();

console.log("Building graph from routes...");
const { stations, edges } = await buildFromRoutes(lines);

console.log("Stations: ", stations.length);
console.log("Edges: ", edges.length);

await insertStations(stations);
console.log("Stations inserted.");

await insertEdges(edges);
console.log("Edges inserted.");

console.log("Graph build complete.");
process.exit();