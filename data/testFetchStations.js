import { getStations } from "./fetchStations.js";

async function test() {
    const stations = await getStations();

    console.log("Total stations:", stations.length);
    console.log("First station: ", stations[0]);
}

test();