'use client';

import { useRef, useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

const COLORS = {
    bg: "#0a0f1a",
    card: "rgba(15, 23, 42, 0.8)",
    border: "#1e3a5f",
    accent: "#3b82f6",
    text: "#94a3b8",
    textMuted: "#64748b",
}

export function MapCanvas() {
    const mapStateRef = useRef({
        center: null,
        zoom: null
    });

    const [hudState, setHudState] = useState({
        zoom: 14,
        center: { lat: 51.5074, lng: -0.1278 },
    })

    const handleMapChange = useCallback((state) => {
        mapStateRef.current = state;
    }, []);

    useEffect(() => {
        const id = setInterval(() => {
            if(!mapStateRef.current.center) return;

            setHudState({
                zoom: mapStateRef.current.zoom,
                center: mapStateRef.current.center,
            });
        }, 100);

        return () => clearInterval(id);
    }, []);

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100vh",
                backgroundColor: COLORS.bg,
            }}
        >
            <LeafletMap onMapChange={handleMapChange} />

            {/* HUD */}
            <div
                style={{
                    position: "absolute",
                    bottom: 16,
                    left: 16,
                    background: COLORS.card,
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    padding: 12,
                    fontFamily: "monospace",
                    fontSize: 13,
                    color: COLORS.text,
                }}
            >
                <div>
                    <span style={{ color: COLORS.accent }}>Zoom:</span> {" "}
                    {hudState.zoom}
                </div>
                <div>
                    <span style={{ color: COLORS.accent }}>Center:</span> {" "}
                    {hudState.center.lat.toFixed(4)},{" "}
                    {hudState.center.lng.toFixed(4)}
                </div>
            </div>

            {/* Title */}
            <div style={{ position: "absolute", top: 16, left: 16 }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: COLORS.text }}>
                    London Underground <span style={{ color: COLORS.accent }}>What If Simulator</span>
                </h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted }}>
                    Interactive Map
                </p>
            </div>
        </div>
    )
}
