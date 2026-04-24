import { NextResponse } from "next/server";
import { getLiveTrainFeed } from "../../../lib/trains/liveTrainFeedService";

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
