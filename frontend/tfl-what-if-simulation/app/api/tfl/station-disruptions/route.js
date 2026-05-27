import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch(
            "https://api.tfl.gov.uk/StopPoint/Mode/tube/Disruption",
            {
                next: { revalidate: 60 },
            }
        );

        if (!response.ok)
            throw new Error(`TfL API ${response.status}`);

        const data = await response.json();

        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "public, max-age=30, s-maxage=60",
            },
        });
    } catch (error) {
        console.error("Failed to fetch TfL station disruptions: ", error);

        return NextResponse.json(
            { error: "Failed to fetch TfL station disruptions" },
            { status: 502 }
        )
    }
}