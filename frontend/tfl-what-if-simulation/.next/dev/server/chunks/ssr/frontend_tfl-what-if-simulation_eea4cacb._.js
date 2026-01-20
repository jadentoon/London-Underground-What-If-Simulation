module.exports = [
"[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MapCanvas",
    ()=>MapCanvas
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/tfl-what-if-simulation/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/tfl-what-if-simulation/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
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
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [transform, setTransform] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        x: 0,
        y: 0,
        scale: 1
    });
    const [isDragging, setIsDragging] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [dragStart, setDragStart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        x: 0,
        y: 0
    });
    const [containerSize, setContainerSize] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        width: 0,
        height: 0
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const updateSize = ()=>{
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };
        updateSize();
        window.addEventListener("resize", updateSize);
        return ()=>window.removeEventListener("resize", updateSize);
    }, []);
    const handleMouseDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        if (e.button === 2) {
            e.preventDefault();
            setIsDragging(true);
            setDragStart({
                x: e.clientX - transform.x,
                y: e.clientY - transform.y
            });
        }
    }, [
        transform.x,
        transform.y
    ]);
    const handleMouseMove = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        if (isDragging) {
            setTransform((prev)=>({
                    ...prev,
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                }));
        }
    }, [
        isDragging,
        dragStart
    ]);
    const handleMouseUp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setIsDragging(false);
    }, []);
    const handleWheel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
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
    }, [
        transform
    ]);
    const handleContextMenu = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        e.preventDefault();
    }, []);
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
            gridLines.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
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
                labels.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
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
            gridLines.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
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
                labels.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                width: containerSize.width,
                height: containerSize.height,
                style: {
                    position: "absolute",
                    top: 0,
                    left: 0
                },
                children: [
                    gridLines,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: 4,
                            fontSize: 11,
                            opacity: 0.6
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: "absolute",
                    top: 16,
                    left: 16
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        style: {
                            margin: 0,
                            fontSize: 20,
                            fontWeight: 600,
                            color: COLORS.text
                        },
                        children: [
                            "London Underground ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
}),
"[project]/frontend/tfl-what-if-simulation/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/frontend/tfl-what-if-simulation/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
];

//# sourceMappingURL=frontend_tfl-what-if-simulation_eea4cacb._.js.map