// Load environment variables from .env file
// Using dotenv ensures sensitive credentials (like API keys) are not hard-coded
import dotenv from 'dotenv';
import path from 'path';

// Resolve the path to the .env file at the project root
// process.cwd() ensures this works regardless of where the script is executed.
dotenv.config({ path: path.join(process.cwd(), ".env") });

// Base URL for all TfL API requests
const BASE = "https://api.tfl.gov.uk";

// TfL API Key from environment variables
// Make sure TFL_APP_KEY is set in your .env file
const APP_KEY = process.env.TFL_APP_KEY;

/**
 * fetchTfl - Generic function to fetch data from the TfL API.

 * @param {string} endpoint - The specific TfL API endpoint (e.g., "/Line/Victoria/Route/Sequence/all").
 * @returns {Promise<Object>} - Parsed JSON response from TfL API.
 * 
 * @throws Will throw an error if the HTTP request fails.
 * 
 * Usage:
 *      const data = await fetchTfl(`/Line/${line.id}/Route/Sequence/all`);
 */
export async function fetchTfl(endpoint) {
    // Construct the full URL with API key.
    const url = `${BASE}${endpoint}?app_key=${APP_KEY}`;

    // Perform the HTTP request
    const res = await fetch(url);

    // Handle HTTP errors gracefully
    if (!res.ok) {
        // Log detailed info for debugging
        console.error("Status:", res.status);
        console.error("URL:", url);

        // Throw an error to allow upstream handling
        throw new Error("TfL API error");
    }

    // Parse and return JSON response.
    return await res.json();
}
