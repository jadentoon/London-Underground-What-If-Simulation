import { useCallback, useEffect, useState } from "react";

const SCENARIO_STORAGE_KEY = "tfl-what-if-scenarios";

function normaliseScenario(rawScenario) {
    if (!rawScenario || typeof rawScenario !== "object") return null;

    const id = typeof rawScenario.id === "string" && rawScenario.id.trim()
        ? rawScenario.id
        : `scenario-${Date.now()}`;

    const name = typeof rawScenario.name === "string" && rawScenario.name.trim()
        ? rawScenario.name.trim()
        : "Untitled scenario";

    return {
        id,
        name,
        createdAt: rawScenario.createdAt || new Date().toISOString(),
        updatedAt: rawScenario.updatedAt || rawScenario.createdAt || new Date().toISOString(),
        closedStations: Array.isArray(rawScenario.closedStations)
            ? rawScenario.closedStations.map(String)
            : [],
        closedLines: Array.isArray(rawScenario.closedLines)
            ? rawScenario.closedLines.map(String)
            : [],
    };
}

function readSavedScenarios() {
    if (typeof window === "undefined") return [];

    try {
        const storedValue = window.localStorage.getItem(SCENARIO_STORAGE_KEY);
        if (!storedValue) return [];

        const parsedValue = JSON.parse(storedValue);
        if (!Array.isArray(parsedValue)) return [];

        return parsedValue
            .map(normaliseScenario)
            .filter(Boolean)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
        console.error("Failed to read saved What-If scenarios", error);
        return [];
    }
}

function writeSavedScenarios(scenarios) {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(scenarios));
    } catch (error) {
        console.error("Failed to save What-If scenarios", error);
    }
}

/**
 * Manages What-If station/line closures and saved closure scenarios.
 *
 * The hook stores simulated closed stations and lines, persists named scenarios
 * in localStorage, and prevents closure toggles when What-If mode is inactive.
 *
 * @param {boolean} hypotheticalSettingsEnabled - Whether What-If mode is active.
 * @returns {Object} Closure state, saved scenarios and What-If action callbacks.
 */
export function useWhatIfClosures(hypotheticalSettingsEnabled) {
    // State to track closed stations (set of station IDs)
    const [closedStations, setClosedStations] = useState(new Set());

    // State to track closed lines in What-If mode (set of line ids)
    const [closedLines, setClosedLines] = useState(new Set());

    // Scenarios saved by the user in this browser.
    const [savedScenarios, setSavedScenarios] = useState([]);

    useEffect(() => {
        setSavedScenarios(readSavedScenarios());
    }, []);

    const persistScenarios = useCallback((updater) => {
        setSavedScenarios((previousScenarios) => {
            const nextScenarios = typeof updater === "function" ? updater(previousScenarios) : updater;
            const normalisedScenarios = nextScenarios
                .map(normaliseScenario)
                .filter(Boolean)
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

            writeSavedScenarios(normalisedScenarios);
            return normalisedScenarios;
        });
    }, []);

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
            const id = String(lineId);

            if (next.has(id)) next.delete(id);
            else next.add(id);
            
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

    const saveCurrentScenario = useCallback((scenarioName) => {
        const name = typeof scenarioName === "string" && scenarioName.trim()
            ? scenarioName.trim()
            : `Scenario ${savedScenarios.length + 1}`;

        const now = new Date().toISOString();
        const scenario = {
            id: `scenario-${Date.now()}`,
            name,
            createdAt: now,
            updatedAt: now,
            closedStations: Array.from(closedStations).sort(),
            closedLines: Array.from(closedLines).sort(),
        };

        persistScenarios((previousScenarios) => [scenario, ...previousScenarios]);
        return scenario;
    }, [closedLines, closedStations, persistScenarios, savedScenarios.length]);

    const loadScenario = useCallback((scenarioId) => {
        const scenario = savedScenarios.find((item) => item.id === scenarioId);
        if (!scenario) return null;

        setClosedStations(new Set(scenario.closedStations.map(String)));
        setClosedLines(new Set(scenario.closedLines.map(String)));
        return scenario;
    }, [savedScenarios]);

    const deleteScenario = useCallback((scenarioId) => {
        persistScenarios((previousScenarios) => previousScenarios.filter((scenario) => scenario.id !== scenarioId));
    }, [persistScenarios]);

    return {
        closedStations,
        closedLines,
        savedScenarios,
        toggleClosedStation,
        handleLineToggle,
        handleResetClosures,
        clearClosedStations,
        clearClosedLines,
        saveCurrentScenario,
        loadScenario,
        deleteScenario,
    };
}
