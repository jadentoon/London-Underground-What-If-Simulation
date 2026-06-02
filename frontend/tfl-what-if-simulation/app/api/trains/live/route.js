import { NextResponse } from "next/server";
import { getLiveTrainFeed } from "../../../lib/trains/liveTrainFeedService";

/**
 * Handles `GET /api/trains/live`.
 *
 * Fetches live TfL train arrivals for the requested line ids and returns the
 * normalised feed payload used by train movement hooks.
 *
 * @param {Request} request - Incoming route request. Optional `lineIds` query parameter is comma-separated.
 * @returns {Promise<import("next/server").NextResponse>} Live train feed response or 502 error.
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const lineIds = searchParams
            .get("lineIds")
            ?.split(",")
            .map((lineId) => lineId.trim())
            .filter(Boolean);

        const feed = await getLiveTrainFeed({ lineIds });
        return NextResponse.json(feed);
    } catch (error) {
        console.error("Failed to fetch live train feed:", error);

        return NextResponse.json(
            { error: "Failed to fetch live train feed" },
            { status: 502 }
        );
    }
}
