module.exports = [
"[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MapCanvas",
    ()=>MapCanvas
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/tfl-what-if-simulation/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/tfl-what-if-simulation/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
const GRID_SIZE_MILES = 1 // Each grid cell represents 1 mile
;
const BASE_CELL_SIZE = 100 // Base pixel size for 1 mile at scale 1
;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const GRID_EXTENT = 50 // How many miles to render in each direction from center
;
function MapCanvas({ className }) {
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
    // Update container size on mount and resize
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
    // Handle right-click drag for panning
    const handleMouseDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        if (e.button === 2) {
            // Right click
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
    // Handle scroll wheel for zooming
    const handleWheel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        e.preventDefault();
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        // Get mouse position relative to container
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        // Calculate zoom
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, transform.scale * zoomFactor));
        // Adjust position to zoom toward mouse cursor
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
    // Prevent context menu on right click
    const handleContextMenu = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        e.preventDefault();
    }, []);
    // Calculate visible grid range
    const cellSize = BASE_CELL_SIZE * transform.scale;
    const centerX = containerSize.width / 2 + transform.x;
    const centerY = containerSize.height / 2 + transform.y;
    // Generate grid lines
    const gridLines = [];
    const labels = [];
    for(let i = -GRID_EXTENT; i <= GRID_EXTENT; i++){
        const x = centerX + i * cellSize;
        const y = centerY + i * cellSize;
        const isMajor = i % 5 === 0;
        // Vertical lines
        if (x >= -cellSize && x <= containerSize.width + cellSize) {
            gridLines.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: x,
                y1: 0,
                x2: x,
                y2: containerSize.height,
                stroke: isMajor ? "var(--map-grid-major)" : "var(--map-grid)",
                strokeWidth: isMajor ? 1.5 : 0.5,
                opacity: isMajor ? 0.8 : 0.4
            }, `v-${i}`, false, {
                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                lineNumber: 127,
                columnNumber: 9
            }, this));
            // X-axis labels (miles from center)
            if (isMajor && transform.scale > 0.3) {
                labels.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                    x: x,
                    y: centerY + 16,
                    fill: "var(--map-label)",
                    fontSize: 11,
                    textAnchor: "middle",
                    fontFamily: "var(--font-mono)",
                    opacity: 0.7,
                    children: i !== 0 ? `${i}mi` : "0"
                }, `lx-${i}`, false, {
                    fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                    lineNumber: 142,
                    columnNumber: 11
                }, this));
            }
        }
        // Horizontal lines
        if (y >= -cellSize && y <= containerSize.height + cellSize) {
            gridLines.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: 0,
                y1: y,
                x2: containerSize.width,
                y2: y,
                stroke: isMajor ? "var(--map-grid-major)" : "var(--map-grid)",
                strokeWidth: isMajor ? 1.5 : 0.5,
                opacity: isMajor ? 0.8 : 0.4
            }, `h-${i}`, false, {
                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                lineNumber: 161,
                columnNumber: 9
            }, this));
            // Y-axis labels (miles from center)
            if (isMajor && i !== 0 && transform.scale > 0.3) {
                labels.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                    x: centerX + 8,
                    y: y + 4,
                    fill: "var(--map-label)",
                    fontSize: 11,
                    textAnchor: "start",
                    fontFamily: "var(--font-mono)",
                    opacity: 0.7,
                    children: `${-i}mi`
                }, `ly-${i}`, false, {
                    fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                    lineNumber: 176,
                    columnNumber: 11
                }, this));
            }
        }
    }
    // Draw center crosshair
    const crosshairSize = 20;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: containerRef,
        className: `relative overflow-hidden select-none ${className}`,
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        onMouseLeave: handleMouseUp,
        onWheel: handleWheel,
        onContextMenu: handleContextMenu,
        style: {
            cursor: isDragging ? "grabbing" : "default"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                width: containerSize.width,
                height: containerSize.height,
                className: "absolute inset-0",
                children: [
                    gridLines,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                        x1: centerX - crosshairSize,
                        y1: centerY,
                        x2: centerX + crosshairSize,
                        y2: centerY,
                        stroke: "var(--accent)",
                        strokeWidth: 2,
                        opacity: 0.8
                    }, void 0, false, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                        lineNumber: 213,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                        x1: centerX,
                        y1: centerY - crosshairSize,
                        x2: centerX,
                        y2: centerY + crosshairSize,
                        stroke: "var(--accent)",
                        strokeWidth: 2,
                        opacity: 0.8
                    }, void 0, false, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                        lineNumber: 222,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                        cx: centerX,
                        cy: centerY,
                        r: 4,
                        fill: "var(--accent)",
                        opacity: 0.9
                    }, void 0, false, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                        lineNumber: 233,
                        columnNumber: 9
                    }, this),
                    labels
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                lineNumber: 208,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg p-3 font-mono text-sm",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-muted-foreground",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-accent",
                                children: "Zoom:"
                            }, void 0, false, {
                                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                                lineNumber: 242,
                                columnNumber: 11
                            }, this),
                            " ",
                            (transform.scale * 100).toFixed(0),
                            "%"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                        lineNumber: 241,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-muted-foreground",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-accent",
                                children: "Pan:"
                            }, void 0, false, {
                                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                                lineNumber: 245,
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
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                        lineNumber: 244,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-muted-foreground mt-1 text-xs opacity-60",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-accent",
                                children: "1 cell"
                            }, void 0, false, {
                                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                                lineNumber: 249,
                                columnNumber: 11
                            }, this),
                            " = ",
                            GRID_SIZE_MILES,
                            " mile"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                        lineNumber: 248,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                lineNumber: 240,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-4 right-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg p-3 text-sm",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-muted-foreground",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-accent font-medium",
                                children: "Right-click + drag"
                            }, void 0, false, {
                                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                                lineNumber: 256,
                                columnNumber: 11
                            }, this),
                            " to pan"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                        lineNumber: 255,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-muted-foreground",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-accent font-medium",
                                children: "Scroll"
                            }, void 0, false, {
                                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                                lineNumber: 259,
                                columnNumber: 11
                            }, this),
                            " to zoom"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                        lineNumber: 258,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                lineNumber: 254,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-4 left-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-xl font-semibold text-foreground",
                        children: [
                            "London Underground ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-accent",
                                children: "Visualiser"
                            }, void 0, false, {
                                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                                lineNumber: 266,
                                columnNumber: 30
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                        lineNumber: 265,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$tfl$2d$what$2d$if$2d$simulation$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-muted-foreground",
                        children: "Interactive Map Grid"
                    }, void 0, false, {
                        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                        lineNumber: 268,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
                lineNumber: 264,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/tfl-what-if-simulation/app/components/map-canvas.tsx",
        lineNumber: 197,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/tfl-what-if-simulation/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/frontend/tfl-what-if-simulation/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
];

//# sourceMappingURL=frontend_tfl-what-if-simulation_41368775._.js.map