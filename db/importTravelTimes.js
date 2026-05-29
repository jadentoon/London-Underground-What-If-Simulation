import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { driver } from "./neo4jClient.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CSV_PATH = path.join(__dirname, "..", "travel_time_data", "tfl_station_travel_times.csv");

const LINE_CODE_TO_ID = {
    BAK: "bakerloo",
    CEN: "central",
    CIR: "circle",
    DIS: "district",
    HAM: "hammersmith-city",
    JUB: "jubilee",
    MET: "metropolitan",
    NTN: "northern",
    PIC: "piccadilly",
    VIC: "victoria",
    WAC: "waterloo-city",
};

function parseCsvLine(line) {
    const values = [];
    let value = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === "\"" && inQuotes && nextChar === "\"") {
            value += "\"";
            i++;
        } else if (char === "\"") {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            values.push(value);
            value = "";
        } else {
            value += char;
        }
    }

    values.push(value);
    return values;
}

function readTravelTimes(csvPath = DEFAULT_CSV_PATH) {
    const csv = fs.readFileSync(csvPath, "utf8").trim();
    const [headerLine, ...lines] = csv.split(/\r?\n/);
    const headers = parseCsvLine(headerLine);

    return lines.map((line) => {
        const values = parseCsvLine(line);
        const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
        const lineId = LINE_CODE_TO_ID[row.line?.toUpperCase()];

        return {
            from: row.from_station_id,
            to: row.to_station_id,
            line: lineId,
            travel_time_seconds: Number(row.travel_time_seconds),
        };
    }).filter((row) =>
        row.from &&
        row.to &&
        row.line &&
        Number.isFinite(row.travel_time_seconds) &&
        row.travel_time_seconds > 0
    );
}

export async function importTravelTimes(csvPath = DEFAULT_CSV_PATH) {
    const travelTimes = readTravelTimes(csvPath);
    const session = driver.session();

    try {
        const result = await session.run(
            `
            UNWIND $travelTimes AS t
            MATCH (a:Station {id: t.from}), (b:Station {id: t.to})
            MATCH (a)-[forward:CONNECTS_TO {line: t.line}]->(b)
            MATCH (b)-[reverse:CONNECTS_TO {line: t.line}]->(a)
            SET forward.travel_time_seconds = t.travel_time_seconds,
                reverse.travel_time_seconds = t.travel_time_seconds
            RETURN
                count(forward) AS forwardUpdated,
                count(reverse) AS reverseUpdated
            `,
            { travelTimes }
        );

        const record = result.records[0];
        const forwardUpdated = record.get("forwardUpdated").toNumber();
        const reverseUpdated = record.get("reverseUpdated").toNumber();

        console.log(`Travel time rows loaded: ${travelTimes.length}`);
        console.log(`Forward relationships updated: ${forwardUpdated}`);
        console.log(`Reverse relationships updated: ${reverseUpdated}`);
    } finally {
        await session.close();
    }
}
