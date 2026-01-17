import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), ".env") });

const BASE = "https://api.tfl.gov.uk";
const APP_KEY = process.env.TFL_APP_KEY;

export async function fetchTfl(endpoint) {
    const url = `${BASE}${endpoint}?app_key=${APP_KEY}`;

    const res = await fetch(url);
    if (!res.ok) {
        console.error("Status:", res.status);
        console.error("URL:", url);
        throw new Error("TfL API error");
    }

    return await res.json();
}
