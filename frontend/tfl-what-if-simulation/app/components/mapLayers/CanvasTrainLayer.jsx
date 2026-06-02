import React, { useCallback, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { TRAIN_COLOURS } from "../mapShared/constants.js";
import { getStationOcclusionRadius } from "../mapShared/stationMarkerSizing.js";

const MIN_TRAIN_ZOOM = 12;
const MAX_TRAIN_ZOOM = 16;
const TRAIN_RADIUS_AT_MIN_ZOOM = 5;
const TRAIN_RADIUS_ZOOM_STEP = 1;
const HIDE_TRAINS_AT_ZOOM = 12;
const TRAIN_BASE_OPACITY = 0.58;
const TRAIN_SELECTED_OPACITY = 0.95;

/**
 * Clamps a numeric value to an inclusive min/max range.
 *
 * @param {number} value - Value to clamp.
 * @param {number} min - Minimum allowed value.
 * @param {number} max - Maximum allowed value.
 * @returns {number} Clamped value.
 */
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

/**
 * Calculates train marker radius from the current map zoom.
 *
 * @param {number} zoom - Current Leaflet zoom level.
 * @returns {number} Radius in canvas pixels.
 */
function getTrainRadiusForZoom(zoom) {
    const safeZoom = clamp(Number.isFinite(zoom) ? zoom : MAX_TRAIN_ZOOM, MIN_TRAIN_ZOOM, MAX_TRAIN_ZOOM);
    return TRAIN_RADIUS_AT_MIN_ZOOM + ((safeZoom - MIN_TRAIN_ZOOM) * TRAIN_RADIUS_ZOOM_STEP);
}

/**
 * Determines whether train markers should be hidden at the current zoom.
 *
 * @param {number} zoom - Current Leaflet zoom level.
 * @returns {boolean} True when train markers should not be drawn.
 */
function shouldHideTrains(zoom) {
    return (Number.isFinite(zoom) ? zoom : MAX_TRAIN_ZOOM) < HIDE_TRAINS_AT_ZOOM + 1;
}

/**
 * Returns the clickable hit radius for a train marker.
 *
 * @param {number} radius - Visual train marker radius.
 * @returns {number} Hit-test radius in pixels.
 */
function getTrainHitRadius(radius) {
    return Math.max(radius + 2, 8);
}

/**
 * Tests whether a point is inside a circular hit area.
 *
 * @param {{ x: number, y: number }} point - Point being tested.
 * @param {{ x: number, y: number }} center - Circle centre.
 * @param {number} radius - Circle radius.
 * @returns {boolean} True when the point falls within the radius.
 */
function isPointWithinRadius(point, center, radius) {
    const dx = center.x - point.x;
    const dy = center.y - point.y;

    return ((dx * dx) + (dy * dy)) <= (radius * radius);
}

/**
 * Checks whether a train click or marker would overlap a station marker.
 *
 * Station occlusion prevents train selection from stealing clicks intended for
 * prominent station markers.
 *
 * @param {{ x: number, y: number }} point - Container point to test.
 * @param {Object} map - Leaflet map instance.
 * @param {Array<Object>} stations - Station marker state used for occlusion sizing.
 * @param {number} zoomLevel - Current Leaflet zoom level.
 * @param {boolean} isLightTheme - Whether light theme marker sizing is active.
 * @returns {boolean} True when the point overlaps a station marker.
 */
function isPointInsideStationOcclusion(point, map, stations, zoomLevel, isLightTheme) {
    for (const station of stations) {
        if (!Number.isFinite(station?.lat) || !Number.isFinite(station?.lon)) continue;

        const stationPoint = map.latLngToContainerPoint([station.lat, station.lon]);
        const occlusionRadius = getStationOcclusionRadius({
            zoomLevel,
            isHighlighted: Boolean(station.isHighlighted),
            isStart: Boolean(station.isStart),
            isOnPath: Boolean(station.isOnPath),
            isClosed: Boolean(station.isClosed),
            isLightTheme,
        });

        if (isPointWithinRadius(point, stationPoint, occlusionRadius)) {
            return true;
        }
    }

    return false;
}

/**
 * Draws a single train marker onto the canvas.
 *
 * Live and fallback trains share the same shape, with line colour, glow and a
 * selected ring used to distinguish state.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
 * @param {{ x: number, y: number }} point - Marker centre in container pixels.
 * @param {Object} train - Train marker data.
 * @param {boolean} isSelected - Whether this train is currently selected.
 * @param {number} radius - Marker radius in pixels.
 * @returns {void}
 */
function drawTrain(ctx, point, train, isSelected, radius) {
    const lineId = String(train?.lineId || "");
    const isNorthern = lineId === "northern";
    const fillColour = isNorthern ? "#111827" : (TRAIN_COLOURS[lineId] || "#38bdf8");
    const borderColour = isNorthern ? "#f8fafc" : "#020617";
    const glowColour = isNorthern ? "#f8fafc" : fillColour;
    const x = point.x;
    const y = point.y;
    const scale = radius / 11;

    ctx.save();
    ctx.globalAlpha = isSelected ? TRAIN_SELECTED_OPACITY : TRAIN_BASE_OPACITY;
    ctx.save();
    ctx.shadowBlur = (train.isLive ? 16 : 11) * scale;
    ctx.shadowColor = glowColour;
    ctx.beginPath();
    ctx.arc(x, y, radius + Math.max(2, 2.5 * scale), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(248, 250, 252, 0.88)";
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(x, y, radius + Math.max(1, 1.4 * scale), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(15, 23, 42, 0.96)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillColour;
    ctx.fill();
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.strokeStyle = borderColour;
    ctx.stroke();

    if (isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, radius + (5 * scale), 0, Math.PI * 2);
        ctx.lineWidth = Math.max(1.5, 3 * scale);
        ctx.strokeStyle = "#f8fafc";
        ctx.stroke();
    }

    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.95;
    ctx.fillRect(x - (4.5 * scale), y - (5 * scale), 9 * scale, 4 * scale);
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(x - (3.5 * scale), y + (4 * scale), 1.4 * scale, 0, Math.PI * 2);
    ctx.arc(x + (3.5 * scale), y + (4 * scale), 1.4 * scale, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();
}

/**
 * Renders train markers as a custom Leaflet canvas layer.
 *
 * Canvas rendering is used instead of individual Leaflet markers so live train
 * movement remains smooth even when many train positions are updated at once.
 * Click handling is implemented manually with canvas hit testing.
 *
 * @param {Object} props - Canvas train layer props.
 * @param {Array<Object>} [props.trains] - Train marker data to draw.
 * @param {string | null} [props.selectedTrainId] - Currently selected train id.
 * @param {(trainId: string | null) => void} props.onTrainSelect - Called when a train is selected or cleared.
 * @param {Array<Object>} [props.stations] - Station marker state used to avoid click occlusion.
 * @param {string} props.paneName - Leaflet pane to attach the canvas to.
 * @param {boolean} [props.isLightTheme] - Whether the map is using the light theme.
 * @returns {null} Canvas layer attaches directly to Leaflet and renders no React DOM.
 */
function CanvasTrainLayerComponent({
    trains = [],
    selectedTrainId = null,
    onTrainSelect,
    stations = [],
    paneName,
    isLightTheme = false,
}) {
    const map = useMap();
    const canvasRef = useRef(null);
    const trainsRef = useRef(trains);
    const stationsRef = useRef(stations);
    const selectedTrainIdRef = useRef(selectedTrainId);
    const animationFrameRef = useRef(null);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const size = map.getSize();
        const scale = window.devicePixelRatio || 1;

        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.clearRect(0, 0, size.x, size.y);

        const zoom = map.getZoom();
        if (shouldHideTrains(zoom)) return;

        const trainRadius = getTrainRadiusForZoom(zoom);
        const hitRadius = getTrainHitRadius(trainRadius);

        for (const train of trainsRef.current) {
            if (!Number.isFinite(train?.lat) || !Number.isFinite(train?.lon)) continue;
            const point = map.latLngToContainerPoint([train.lat, train.lon]);
            if (
                point.x < -hitRadius ||
                point.y < -hitRadius ||
                point.x > size.x + hitRadius ||
                point.y > size.y + hitRadius
            ) {
                continue;
            }

            drawTrain(ctx, point, train, String(train.id) === String(selectedTrainIdRef.current), trainRadius);
        }
    }, [map]);

    const scheduleDraw = useCallback(() => {
        if (animationFrameRef.current) return;
        animationFrameRef.current = window.requestAnimationFrame(() => {
            animationFrameRef.current = null;
            draw();
        });
    }, [draw]);

    useEffect(() => {
        trainsRef.current = trains;
        scheduleDraw();
    }, [trains, scheduleDraw]);

    useEffect(() => {
        selectedTrainIdRef.current = selectedTrainId;
        scheduleDraw();
    }, [selectedTrainId, scheduleDraw]);

    useEffect(() => {
        stationsRef.current = stations;
    }, [stations]);

    useEffect(() => {
        const canvas = L.DomUtil.create("canvas", "canvas-train-layer");
        const pane = map.getPane(paneName) ?? map.getPanes().overlayPane;
        canvas.style.position = "absolute";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = "0";
        pane.appendChild(canvas);
        canvasRef.current = canvas;

        function resetCanvas() {
            const size = map.getSize();
            const scale = window.devicePixelRatio || 1;
            const topLeft = map.containerPointToLayerPoint([0, 0]);

            canvas.width = Math.round(size.x * scale);
            canvas.height = Math.round(size.y * scale);
            canvas.style.width = `${size.x}px`;
            canvas.style.height = `${size.y}px`;
            L.DomUtil.setPosition(canvas, topLeft);

            scheduleDraw();
        }

        function handleMapClick(event) {
            const zoom = map.getZoom();

            if (shouldHideTrains(zoom)) {
                onTrainSelect?.(null);
                return;
            }

            const clickPoint = map.latLngToContainerPoint(event.latlng);
            if (isPointInsideStationOcclusion(clickPoint, map, stationsRef.current, zoom, isLightTheme)) {
                return;
            }

            let clickedTrain = null;
            const hitRadius = getTrainHitRadius(getTrainRadiusForZoom(zoom));

            for (let i = trainsRef.current.length - 1; i >= 0; i -= 1) {
                const train = trainsRef.current[i];
                if (!Number.isFinite(train?.lat) || !Number.isFinite(train?.lon)) continue;

                const point = map.latLngToContainerPoint([train.lat, train.lon]);
                if (isPointInsideStationOcclusion(point, map, stationsRef.current, zoom, isLightTheme)) {
                    continue;
                }

                if (isPointWithinRadius(clickPoint, point, hitRadius)) {
                    clickedTrain = train;
                    break;
                }
            }

            if (!clickedTrain) {
                onTrainSelect?.(null);
                return;
            }

            onTrainSelect?.(clickedTrain.id);
        }

        map.on("move zoom resize", resetCanvas);
        map.on("preclick", handleMapClick);
        resetCanvas();

        return () => {
            if (animationFrameRef.current) {
                window.cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            map.off("move zoom resize", resetCanvas);
            map.off("preclick", handleMapClick);
            canvas.remove();
            canvasRef.current = null;
        };
    }, [isLightTheme, map, onTrainSelect, paneName, scheduleDraw]);

    return null;
}

/**
 * Memoised canvas train layer.
 *
 * The layer stores frequently changing train data in refs and schedules canvas
 * redraws manually, so React rerenders are kept to a minimum.
 */
const CanvasTrainLayer = React.memo(CanvasTrainLayerComponent);

export default CanvasTrainLayer;
