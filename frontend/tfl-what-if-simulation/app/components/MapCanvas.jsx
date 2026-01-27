'use client';

import { useRef, useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

const GRID_SIZE_MILES = 1
const BASE_CELL_SIZE = 100
const MIN_SCALE = 0.4 // min 
const MAX_SCALE = 3.0 // max of 100
const GRID_EXTENT = 50

const COLORS = {
    bg: "#0a0f1a",
    grid: "#1e3a5f",
    gridMajor: "#2d5a87",
    accent: "#3b82f6",
    text: "#94a3b8",
    textMuted: "#64748b",
    card: "rgba(15, 23, 42, 0.8)",
    border: "#1e3a5f",
}

const LONDON_CENTER = [51.5074, -0.1278]

function milesToLatLng(dxMiles, dyMiles) {
    const milesPerDegreeLat = 69
    const milesPerDegreeLng = 43
    return [
        LONDON_CENTER[0] + dyMiles / milesPerDegreeLat,
        LONDON_CENTER[1] + dxMiles / milesPerDegreeLng,
    ]
}

export function MapCanvas() {
    const containerRef = useRef(null)
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: MIN_SCALE })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [showControls, setShowControls] = useState(true)
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                })
            }
        }
        updateSize()
        window.addEventListener("resize", updateSize)
        return () => window.removeEventListener("resize", updateSize)
    }, [])

    // Hide controls after 15 seconds
    useEffect(() => {
        const t = setTimeout(() => setShowControls(false), 15000)
        return () => clearTimeout(t)
    }, [])

    const handleMouseDown = useCallback(
        (e) => {
            if (e.button === 2) {
                e.preventDefault()
                setIsDragging(true)
                setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
            }
        },
        [transform.x, transform.y]
    )

    const handleMouseMove = useCallback(
        (e) => {
            if (isDragging) {
                const proposedX = e.clientX - dragStart.x
                const proposedY = e.clientY - dragStart.y
                setTransform((prev) => {
                    const scale = prev.scale
                    const cellSize = BASE_CELL_SIZE * scale
                    const halfMilesX = (containerSize.width / 2) / cellSize
                    const halfMilesY = (containerSize.height / 2) / cellSize
                    const minCenterX = -30 + halfMilesX
                    const maxCenterX = 30 - halfMilesX
                    const minCenterY = -30 + halfMilesY
                    const maxCenterY = 30 - halfMilesY

                    let centerMilesX = -proposedX / cellSize
                    let centerMilesY = proposedY / cellSize

                    if (minCenterX > maxCenterX) centerMilesX = 0
                    else centerMilesX = Math.max(minCenterX, Math.min(maxCenterX, centerMilesX))

                    if (minCenterY > maxCenterY) centerMilesY = 0
                    else centerMilesY = Math.max(minCenterY, Math.min(maxCenterY, centerMilesY))

                    return { x: -centerMilesX * cellSize, y: centerMilesY * cellSize, scale }
                })
            }
        },
        [isDragging, dragStart, containerSize]
    )

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleWheel = useCallback(
        (e) => {
            e.preventDefault()
            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return

            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
            setTransform((prev) => {
                const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * zoomFactor))
                const scaleRatio = newScale / prev.scale
                const newX = mouseX - (mouseX - prev.x) * scaleRatio
                const newY = mouseY - (mouseY - prev.y) * scaleRatio

                const cellSize = BASE_CELL_SIZE * newScale
                const halfMilesX = (containerSize.width / 2) / cellSize
                const halfMilesY = (containerSize.height / 2) / cellSize
                const minCenterX = -30 + halfMilesX
                const maxCenterX = 30 - halfMilesX
                const minCenterY = -30 + halfMilesY
                const maxCenterY = 30 - halfMilesY

                let centerMilesX = -newX / cellSize
                let centerMilesY = newY / cellSize

                if (minCenterX > maxCenterX) centerMilesX = 0
                else centerMilesX = Math.max(minCenterX, Math.min(maxCenterX, centerMilesX))

                if (minCenterY > maxCenterY) centerMilesY = 0
                else centerMilesY = Math.max(minCenterY, Math.min(maxCenterY, centerMilesY))

                return { x: -centerMilesX * cellSize, y: centerMilesY * cellSize, scale: newScale }
            })
        },
        [containerSize]
    )

    const handleContextMenu = useCallback((e) => {
        e.preventDefault()
    }, [])

    const cellSize = BASE_CELL_SIZE * transform.scale
    const centerX = containerSize.width / 2 + transform.x
    const centerY = containerSize.height / 2 + transform.y

    const gridLines = []
    const labels = []

    for (let i = -GRID_EXTENT; i <= GRID_EXTENT; i++) {
        const x = centerX + i * cellSize
        const y = centerY + i * cellSize
        const isMajor = i % 5 === 0

        if (x >= -cellSize && x <= containerSize.width + cellSize) {
            gridLines.push(
                <line
                    key={`v-${i}`}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={containerSize.height}
                    stroke={isMajor ? COLORS.gridMajor : COLORS.grid}
                    strokeWidth={isMajor ? 1.5 : 0.5}
                    opacity={isMajor ? 0.8 : 0.4}
                />
            )

            if (isMajor && transform.scale > 0.3) {
                labels.push(
                    <text
                        key={`lx-${i}`}
                        x={x}
                        y={centerY + 16}
                        fill={COLORS.textMuted}
                        fontSize={11}
                        textAnchor="middle"
                        fontFamily="monospace"
                        opacity={0.7}
                    >
                        {i !== 0 ? `${i}mi` : "0"}
                    </text>
                )
            }
        }

        if (y >= -cellSize && y <= containerSize.height + cellSize) {
            gridLines.push(
                <line
                    key={`h-${i}`}
                    x1={0}
                    y1={y}
                    x2={containerSize.width}
                    y2={y}
                    stroke={isMajor ? COLORS.gridMajor : COLORS.grid}
                    strokeWidth={isMajor ? 1.5 : 0.5}
                    opacity={isMajor ? 0.8 : 0.4}
                />
            )

            if (isMajor && i !== 0 && transform.scale > 0.3) {
                labels.push(
                    <text
                        key={`ly-${i}`}
                        x={centerX + 8}
                        y={y + 4}
                        fill={COLORS.textMuted}
                        fontSize={11}
                        textAnchor="start"
                        fontFamily="monospace"
                        opacity={0.7}
                    >
                        {`${-i}mi`}
                    </text>
                )
            }
        }
    }

    const crosshairSize = 20

    const milesX = -transform.x / cellSize
    const milesY = transform.y / cellSize
    const mapCenter = milesToLatLng(milesX, milesY)
    const leafletZoom = Math.round(12 + Math.log2(transform.scale))

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100vh",
                overflow: "hidden",
                userSelect: "none",
                backgroundColor: COLORS.bg,
                cursor: isDragging ? "grabbing" : "default",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onContextMenu={handleContextMenu}
        >
            <LeafletMap center={mapCenter} zoom={leafletZoom} />
            <svg
                width={containerSize.width}
                height={containerSize.height}
                style={{ position: "absolute", top: 0, left: 0 }}
            >
                {gridLines}

                <line
                    x1={centerX - crosshairSize}
                    y1={centerY}
                    x2={centerX + crosshairSize}
                    y2={centerY}
                    stroke={COLORS.accent}
                    strokeWidth={2}
                    opacity={0.8}
                />
                <line
                    x1={centerX}
                    y1={centerY - crosshairSize}
                    x2={centerX}
                    y2={centerY + crosshairSize}
                    stroke={COLORS.accent}
                    strokeWidth={2}
                    opacity={0.8}
                />
                <circle cx={centerX} cy={centerY} r={4} fill={COLORS.accent} opacity={0.9} />

                {labels}
            </svg>

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
                    <span style={{ color: COLORS.accent }}>Zoom:</span> {(transform.scale * 100).toFixed(0)}%
                </div>
                <div>
                    <span style={{ color: COLORS.accent }}>Pan:</span> ({Math.round(-transform.x / cellSize)},{" "}
                    {Math.round(transform.y / cellSize)}) mi
                </div>
                <div style={{ marginTop: 4, fontSize: 11, opacity: 0.6 }}>
                    <span style={{ color: COLORS.accent }}>1 cell</span> = {GRID_SIZE_MILES} mile
                </div>
            </div>

            {/* Controls */}
            {showControls && (
                <div
                    style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        background: COLORS.card,
                        backdropFilter: "blur(8px)",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 13,
                        color: COLORS.text,
                    }}
                >
                    <div>
                        <span style={{ color: COLORS.accent, fontWeight: 500 }}>Right-click + drag</span> to pan
                    </div>
                    <div>
                        <span style={{ color: COLORS.accent, fontWeight: 500 }}>Scroll</span> to zoom
                    </div>
                </div>
            )}

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
