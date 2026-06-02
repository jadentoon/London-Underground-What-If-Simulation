import { useCallback, useState } from "react";

/**
 * Manages train marker visibility and line filtering controls.
 * 
 * Used by the control panel to show/hide trains, switch between all trains
 * and selected-line filtering and track which lines are visible.
 * 
 * @returns {Object} Train display state and filter action callbacks.
 */
export function useTrainFilters() {
    const [showTrains, setShowTrains] = useState(true);
    const [trainFilterMode, setTrainFilterMode] = useState("all");
    const [visibleTrainLines, setVisibleTrainLines] = useState(new Set());

    const handleToggleShowTrains = useCallback(() => {
        setShowTrains((prev) => !prev);
    }, []);

    const handleTrainFilterModeChange = useCallback((mode) => {
        setTrainFilterMode(mode);
    }, []);

    const handleToggleVisibleTrainLine = useCallback((lineId) => {
        setVisibleTrainLines((prev) => {
            const next = new Set(prev);
            const id = String(lineId);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    return {
        showTrains,
        trainFilterMode,
        visibleTrainLines,
        handleToggleShowTrains,
        handleTrainFilterModeChange,
        handleToggleVisibleTrainLine,
    };
}