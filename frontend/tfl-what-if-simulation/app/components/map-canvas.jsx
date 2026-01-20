'use client';

import { useRef, useState, useCallback, useEffect } from "react"

const GRID_SIZE_MILES = 1
const BASE_CELL_SIZE = 100
const MIN_SCALE = 0.1
const MAX_SCALE = 5
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

export function MapCanvas() {
  const containerRef = useRef(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
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
        setTransform((prev) => ({
          ...prev,
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        }))
      }
    },
    [isDragging, dragStart]
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
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, transform.scale * zoomFactor))
      const scaleRatio = newScale / transform.scale
      const newX = mouseX - (mouseX - transform.x) * scaleRatio
      const newY = mouseY - (mouseY - transform.y) * scaleRatio

      setTransform({ x: newX, y: newY, scale: newScale })
    },
    [transform]
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

      {/* Title */}
      <div style={{ position: "absolute", top: 16, left: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: COLORS.text }}>
          London Underground <span style={{ color: COLORS.accent }}>Visualiser</span>
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted }}>
          Interactive Map Grid
        </p>
      </div>
    </div>
  )
}
