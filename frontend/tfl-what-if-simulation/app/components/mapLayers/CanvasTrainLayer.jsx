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

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function getTrainRadiusForZoom(zoom) {
    const safeZoom = clamp(Number.isFinite(zoom) ? zoom : MAX_TRAIN_ZOOM, MIN_TRAIN_ZOOM, MAX_TRAIN_ZOOM);
    return TRAIN_RADIUS_AT_MIN_ZOOM + ((safeZoom - MIN_TRAIN_ZOOM) * TRAIN_RADIUS_ZOOM_STEP);
}

function shouldHideTrains(zoom) {
    return (Number.isFinite(zoom) ? zoom : MAX_TRAIN_ZOOM) < HIDE_TRAINS_AT_ZOOM + 1;
}

function getTrainHitRadius(radius) {
    return Math.max(radius + 2, 8);
}

function isPointWithinRadius(point, center, radius) {
    const dx = center.x - point.x;
    const dy = center.y - point.y;

    return ((dx * dx) + (dy * dy)) <= (radius * radius);
}

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

const CanvasTrainLayer = React.memo(CanvasTrainLayerComponent);

export default CanvasTrainLayer;
