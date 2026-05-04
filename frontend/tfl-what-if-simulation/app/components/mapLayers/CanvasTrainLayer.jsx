import React, { useCallback, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { TRAIN_COLOURS } from "../mapComponents/constants.js";

const TRAIN_RADIUS = 9;
const HIT_RADIUS = 13;

function drawTrain(ctx, point, train, isSelected) {
    const lineId = String(train?.lineId || "");
    const isNorthern = lineId === "northern";
    const fillColour = isNorthern ? "#111827" : (TRAIN_COLOURS[lineId] || "#38bdf8");
    const borderColour = isNorthern ? "#f8fafc" : "#020617";
    const glowColour = isNorthern ? "#f8fafc" : fillColour;
    const x = point.x;
    const y = point.y;

    ctx.save();
    ctx.shadowBlur = train.isLive ? 12 : 8;
    ctx.shadowColor = glowColour;
    ctx.beginPath();
    ctx.arc(x, y, TRAIN_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(x, y, TRAIN_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = fillColour;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = borderColour;
    ctx.stroke();

    if (isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, TRAIN_RADIUS + 5, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#f8fafc";
        ctx.stroke();
    }

    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.95;
    ctx.fillRect(x - 4.5, y - 5, 9, 4);
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(x - 3.5, y + 4, 1.4, 0, Math.PI * 2);
    ctx.arc(x + 3.5, y + 4, 1.4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
}

function CanvasTrainLayerComponent({ trains = [], selectedTrainId = null, onTrainSelect }) {
    const map = useMap();
    const canvasRef = useRef(null);
    const trainsRef = useRef(trains);
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

        for (const train of trainsRef.current) {
            if (!Number.isFinite(train?.lat) || !Number.isFinite(train?.lon)) continue;
            const point = map.latLngToContainerPoint([train.lat, train.lon]);
            if (
                point.x < -HIT_RADIUS ||
                point.y < -HIT_RADIUS ||
                point.x > size.x + HIT_RADIUS ||
                point.y > size.y + HIT_RADIUS
            ) {
                continue;
            }

            drawTrain(ctx, point, train, String(train.id) === String(selectedTrainIdRef.current));
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
        const canvas = L.DomUtil.create("canvas", "canvas-train-layer");
        const pane = map.getPanes().overlayPane;
        canvas.style.position = "absolute";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = "450";
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
            const clickPoint = map.latLngToContainerPoint(event.latlng);
            let clickedTrain = null;

            for (let i = trainsRef.current.length - 1; i >= 0; i -= 1) {
                const train = trainsRef.current[i];
                if (!Number.isFinite(train?.lat) || !Number.isFinite(train?.lon)) continue;

                const point = map.latLngToContainerPoint([train.lat, train.lon]);
                const dx = point.x - clickPoint.x;
                const dy = point.y - clickPoint.y;

                if ((dx * dx) + (dy * dy) <= HIT_RADIUS * HIT_RADIUS) {
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
    }, [map, onTrainSelect, scheduleDraw]);

    return null;
}

const CanvasTrainLayer = React.memo(CanvasTrainLayerComponent);

export default CanvasTrainLayer;
