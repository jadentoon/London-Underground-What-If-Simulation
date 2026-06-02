import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Manages the lightweight map HUD state shown over the Leaflet map.
 * 
 * Camera changes are stored in a ref and copied into React state on a short
 * interval, reducing rerenders while the map is being dragged or zoomed.
 * 
 * @param {{ lat: number, lng: number }} defaultCenter - Initial map centre shown in the HUD.
 * @returns {{
 *  hudState: { zoom: number, center: Object },
 *  handleMapChange: (state: {center: Object, zoom: number }) => void
 * }} HUD display state and Leaflet camera-change handler.
 */
export function useHudState(defaultCenter) {
    // Reference to store the current map state (center & zoom) without triggering React renders.
    const mapStateRef = useRef({
        center: null,
        zoom: null
    });

    // React state for HUD display - updated periodically from ref.
    const [hudState, setHudState] = useState({
        zoom: 14,
        center: defaultCenter,
    });

    /**
     * Callback passed to LeafletMap to receive camera changes.
     * Updating the mapStateRef with the latest center and zoom.
     */
    const handleMapChange = useCallback((state) => {
        mapStateRef.current = state;
    }, []);

    useEffect(() => {
        const id = setInterval(() => {
            if(!mapStateRef.current.center) return;

            const nextZoom = mapStateRef.current.zoom;
            const nextCenter = mapStateRef.current.center;

            setHudState((prev) => {
                // Keep the HUD polling lightweight by skipping identical camera
                // updates, which also avoids unnecessary rerenders in dev.
                const sameZoom = prev.zoom === nextZoom;
                const sameLat = prev.center?.lat === nextCenter?.lat;
                const sameLng = prev.center?.lng === nextCenter?.lng;

                if (sameZoom && sameLat && sameLng) {
                    return prev;
                }

                return {
                    zoom: nextZoom,
                    center: nextCenter,
                };
            });
        }, 100);

        return () => clearInterval(id);
    }, []);

    return {
        hudState,
        handleMapChange,
    };
}