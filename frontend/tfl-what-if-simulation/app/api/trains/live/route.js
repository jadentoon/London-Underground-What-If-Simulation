import { NextResponse } from "next/server";
import { getLiveTrainFeed } from "../../../lib/trains/liveTrainFeedService";

export async function GET() {
    try {
        const feed = await getLiveTrainFeed();
        return NextResponse.json(feed);
    } catch (error) {
        console.error("Failed to fetch live train feed:", error);

        return NextResponse.json(
            { error: "Failed to fetch live train feed" },
            { status: 502 }
        );
    }
}
