import { NextResponse } from "next/server";

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