(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MapCanvas",
    ()=>MapCanvas
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/tfl-what-if-simulation/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/tfl-what-if-simulation/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
const GRID_SIZE_MILES = 1;
const BASE_CELL_SIZE = 100;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const GRID_EXTENT = 50;
const COLORS = {
    bg: "#0a0f1a",
    grid: "#1e3a5f",
    gridMajor: "#2d5a87",
    accent: "#3b82f6",
    text: "#94a3b8",
    textMuted: "#64748b",
    card: "rgba(15, 23, 42, 0.8)",
    border: "#1e3a5f"
};
function MapCanvas() {
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [transform, setTransform] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        x: 0,
        y: 0,
        scale: 1
    });
    const [isDragging, setIsDragging] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [dragStart, setDragStart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        x: 0,
        y: 0
    });
    const [containerSize, setContainerSize] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        width: 0,
        height: 0
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MapCanvas.useEffect": ()=>{
            const updateSize = {
                "MapCanvas.useEffect.updateSize": ()=>{
                    if (containerRef.current) {
                        setContainerSize({
                            width: containerRef.current.clientWidth,
                            height: containerRef.current.clientHeight
                        });
                    }
                }
            }["MapCanvas.useEffect.updateSize"];
            updateSize();
            window.addEventListener("resize", updateSize);
            return ({
                "MapCanvas.useEffect": ()=>window.removeEventListener("resize", updateSize)
            })["MapCanvas.useEffect"];
        }
    }["MapCanvas.useEffect"], []);
    const handleMouseDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MapCanvas.useCallback[handleMouseDown]": (e)=>{
            if (e.button === 2) {
                e.preventDefault();
                setIsDragging(true);
                setDragStart({
                    x: e.clientX - transform.x,
                    y: e.clientY - transform.y
                });
            }
        }
    }["MapCanvas.useCallback[handleMouseDown]"], [
        transform.x,
        transform.y
    ]);
    const handleMouseMove = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MapCanvas.useCallback[handleMouseMove]": (e)=>{
            if (isDragging) {
                setTransform({
                    "MapCanvas.useCallback[handleMouseMove]": (prev)=>({
                            ...prev,
                            x: e.clientX - dragStart.x,
                            y: e.clientY - dragStart.y
                        })
                }["MapCanvas.useCallback[handleMouseMove]"]);
            }
        }
    }["MapCanvas.useCallback[handleMouseMove]"], [
        isDragging,
        dragStart
    ]);
    const handleMouseUp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MapCanvas.useCallback[handleMouseUp]": ()=>{
            setIsDragging(false);
        }
    }["MapCanvas.useCallback[handleMouseUp]"], []);
    const handleWheel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MapCanvas.useCallback[handleWheel]": (e)=>{
            e.preventDefault();
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, transform.scale * zoomFactor));
            const scaleRatio = newScale / transform.scale;
            const newX = mouseX - (mouseX - transform.x) * scaleRatio;
            const newY = mouseY - (mouseY - transform.y) * scaleRatio;
            setTransform({
                x: newX,
                y: newY,
                scale: newScale
            });
        }
    }["MapCanvas.useCallback[handleWheel]"], [
        transform
    ]);
    const handleContextMenu = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MapCanvas.useCallback[handleContextMenu]": (e)=>{
            e.preventDefault();
        }
    }["MapCanvas.useCallback[handleContextMenu]"], []);
    const cellSize = BASE_CELL_SIZE * transform.scale;
    const centerX = containerSize.width / 2 + transform.x;
    const centerY = containerSize.height / 2 + transform.y;
    const gridLines = [];
    const labels = [];
    for(let i = -GRID_EXTENT; i <= GRID_EXTENT; i++){
        const x = centerX + i * cellSize;
        const y = centerY + i * cellSize;
        const isMajor = i % 5 === 0;
        if (x >= -cellSize && x <= containerSize.width + cellSize) {
            gridLines.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: x,
                y1: 0,
                x2: x,
                y2: containerSize.height,
                stroke: isMajor ? COLORS.gridMajor : COLORS.grid,
                strokeWidth: isMajor ? 1.5 : 0.5,
                opacity: isMajor ? 0.8 : 0.4
            }, `v-${i}`, false, {
                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                lineNumber: 108,
                columnNumber: 9
            }, this));
            if (isMajor && transform.scale > 0.3) {
                labels.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                    x: x,
                    y: centerY + 16,
                    fill: COLORS.textMuted,
                    fontSize: 11,
                    textAnchor: "middle",
                    fontFamily: "monospace",
                    opacity: 0.7,
                    children: i !== 0 ? `${i}mi` : "0"
                }, `lx-${i}`, false, {
                    fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                    lineNumber: 122,
                    columnNumber: 11
                }, this));
            }
        }
        if (y >= -cellSize && y <= containerSize.height + cellSize) {
            gridLines.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: 0,
                y1: y,
                x2: containerSize.width,
                y2: y,
                stroke: isMajor ? COLORS.gridMajor : COLORS.grid,
                strokeWidth: isMajor ? 1.5 : 0.5,
                opacity: isMajor ? 0.8 : 0.4
            }, `h-${i}`, false, {
                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                lineNumber: 140,
                columnNumber: 9
            }, this));
            if (isMajor && i !== 0 && transform.scale > 0.3) {
                labels.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                    x: centerX + 8,
                    y: y + 4,
                    fill: COLORS.textMuted,
                    fontSize: 11,
                    textAnchor: "start",
                    fontFamily: "monospace",
                    opacity: 0.7,
                    children: `${-i}mi`
                }, `ly-${i}`, false, {
                    fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                    lineNumber: 154,
                    columnNumber: 11
                }, this));
            }
        }
    }
    const crosshairSize = 20;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: containerRef,
        style: {
            position: "relative",
            width: "100%",
            height: "100vh",
            overflow: "hidden",
            userSelect: "none",
            backgroundColor: COLORS.bg,
            cursor: isDragging ? "grabbing" : "default"
        },
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        onMouseLeave: handleMouseUp,
        onWheel: handleWheel,
        onContextMenu: handleContextMenu,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                width: containerSize.width,
                height: containerSize.height,
                style: {
                    position: "absolute",
                    top: 0,
                    left: 0
                },
                children: [
                    gridLines,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                        x1: centerX - crosshairSize,
                        y1: centerY,
                        x2: centerX + crosshairSize,
                        y2: centerY,
                        stroke: COLORS.accent,
                        strokeWidth: 2,
                        opacity: 0.8
                    }, void 0, false, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                        lineNumber: 199,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                        x1: centerX,
                        y1: centerY - crosshairSize,
                        x2: centerX,
                        y2: centerY + crosshairSize,
                        stroke: COLORS.accent,
                        strokeWidth: 2,
                        opacity: 0.8
                    }, void 0, false, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                        lineNumber: 208,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                        cx: centerX,
                        cy: centerY,
                        r: 4,
                        fill: COLORS.accent,
                        opacity: 0.9
                    }, void 0, false, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                        lineNumber: 217,
                        columnNumber: 9
                    }, this),
                    labels
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                lineNumber: 192,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
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
                    color: COLORS.text
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: COLORS.accent
                                },
                                children: "Zoom:"
                            }, void 0, false, {
                                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                                lineNumber: 239,
                                columnNumber: 11
                            }, this),
                            " ",
                            (transform.scale * 100).toFixed(0),
                            "%"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                        lineNumber: 238,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: COLORS.accent
                                },
                                children: "Pan:"
                            }, void 0, false, {
                                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                                lineNumber: 242,
                                columnNumber: 11
                            }, this),
                            " (",
                            Math.round(-transform.x / cellSize),
                            ",",
                            " ",
                            Math.round(transform.y / cellSize),
                            ") mi"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                        lineNumber: 241,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: 4,
                            fontSize: 11,
                            opacity: 0.6
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: COLORS.accent
                                },
                                children: "1 cell"
                            }, void 0, false, {
                                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                                lineNumber: 246,
                                columnNumber: 11
                            }, this),
                            " = ",
                            GRID_SIZE_MILES,
                            " mile"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                        lineNumber: 245,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                lineNumber: 223,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: "absolute",
                    top: 16,
                    right: 16,
                    background: COLORS.card,
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 13,
                    color: COLORS.text
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: COLORS.accent,
                                    fontWeight: 500
                                },
                                children: "Right-click + drag"
                            }, void 0, false, {
                                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                                lineNumber: 266,
                                columnNumber: 11
                            }, this),
                            " to pan"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                        lineNumber: 265,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: COLORS.accent,
                                    fontWeight: 500
                                },
                                children: "Scroll"
                            }, void 0, false, {
                                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                                lineNumber: 269,
                                columnNumber: 11
                            }, this),
                            " to zoom"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                        lineNumber: 268,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                lineNumber: 251,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: "absolute",
                    top: 16,
                    left: 16
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        style: {
                            margin: 0,
                            fontSize: 20,
                            fontWeight: 600,
                            color: COLORS.text
                        },
                        children: [
                            "London Underground ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: COLORS.accent
                                },
                                children: "Visualiser"
                            }, void 0, false, {
                                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                                lineNumber: 276,
                                columnNumber: 30
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                        lineNumber: 275,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            margin: "4px 0 0",
                            fontSize: 13,
                            color: COLORS.textMuted
                        },
                        children: "Interactive Map Grid"
                    }, void 0, false, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                        lineNumber: 278,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
                lineNumber: 274,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx",
        lineNumber: 174,
        columnNumber: 5
    }, this);
}
_s(MapCanvas, "1q5wNr+2LgjSfvU4TasLWJmc4Qs=");
_c = MapCanvas;
var _c;
__turbopack_context__.k.register(_c, "MapCanvas");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/tfl-what-if-simulation/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/frontend/tfl-what-if-simulation/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/frontend/tfl-what-if-simulation/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/frontend/tfl-what-if-simulation/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/frontend/tfl-what-if-simulation/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/frontend/tfl-what-if-simulation/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
]);

//# sourceMappingURL=frontend_tfl-what-if-simulation_be03c167._.js.map