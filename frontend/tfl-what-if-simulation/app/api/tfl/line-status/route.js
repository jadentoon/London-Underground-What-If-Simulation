import { NextResponse } from "next/server";

/**
 * Handles `GET /api/tfl/line-status`.
 *
 * Proxies TfL tube line status data through the Next.js server so the frontend
 * can request live status without calling TfL directly. Passing `detail=true`
 * forwards TfL's detailed disruption data for partial-closure handling.
 *
 * @param {Request} request - Incoming Next.js route request.
 * @returns {Promise<import("next/server").NextResponse>} TfL line status response or 502 error.
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const detail = searchParams.get("detail");

        const url = new URL("https://api.tfl.gov.uk/Line/Mode/tube/Status");

        if (detail === "true") 
            url.searchParams.set("detail", "true");

        const response = await fetch(url.toString(), {
            next: { revalidate: 60 },
        });

        if (!response.ok) 
            throw new Error (`TfL API ${response.status}`);

        const data = await response.json();

        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "public, max-age=30, s-maxage=60",
            },
        });       
    } catch (error) {
        console.error("Failed to fetch TfL line status: ", error);

        return NextResponse.json(
            { error: "Failed to fetch TfL line status" },
            { status: 502}
        );
    }
}
