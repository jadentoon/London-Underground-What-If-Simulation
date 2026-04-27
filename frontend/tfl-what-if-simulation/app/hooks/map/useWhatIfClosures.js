import { useCallback, useState } from "react";

export function useWhatIfClosures(hypotheticalSettingsEnabled) {
    // State to track closed stations (set of station IDs)
    const [closedStations, setClosedStations] = useState(new Set());

    // State to track closed lines in What-If mode (set of line ids)
    const [closedLines, setClosedLines] = useState(new Set());

    /**
     * Toggle a station's closed state (only in what-if mode)
     */
    const toggleClosedStation = useCallback((stationId) => {
        if (!hypotheticalSettingsEnabled) return;
        
        setClosedStations(prev => {
            const next = new Set(prev);
            const id = String(stationId);

            if (next.has(id)) next.delete(id);
            else next.add(id);

            return next;
        });
    }, [hypotheticalSettingsEnabled]);

    /**
     * Toggle a line's closed state (only in what-if mode)
     */
    const handleLineToggle = useCallback((lineId) => {
        if (!hypotheticalSettingsEnabled) return;

        setClosedLines(prev => {
            const next = new Set(prev);

            if (next.has(lineId)) next.delete(lineId);
            else next.add(lineId);
            
            return next;
        });
    }, [hypotheticalSettingsEnabled]);

    /**
     * Reset all closures (stations and lines) in what-if mode
     */
    const handleResetClosures = useCallback(() => {
        if (!hypotheticalSettingsEnabled) return;

        setClosedStations(new Set());
        setClosedLines(new Set());
    }, [hypotheticalSettingsEnabled]);

    const clearClosedStations = useCallback(() => {
        setClosedStations(new Set());
    }, []);

    const clearClosedLines = useCallback(() => {
        setClosedLines(new Set());
    }, []);

    return {
        closedStations,
        closedLines,
        toggleClosedStation,
        handleLineToggle,
        handleResetClosures,
        clearClosedStations,
        clearClosedLines
    };
}