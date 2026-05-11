import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useStationSearch(leafletMapRef) {
    // Stations list for search (filled by LeafletMap once loaded)
    const [stationsForSearch, setStationsForSearch] = useState([]);

    //Search input value
    const [stationQuery, setStationQuery] = useState("");

    // Highlighted station after search selection
    const [highlightedStationId, setHighlightedStationId] = useState(null);
    const [focusedStation, setFocusedStation] = useState(null);
    const highlightTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
            }
        };
    }, []);

    const handleStationsLoaded = useCallback((nodes) => {
        setStationsForSearch(nodes || []);
    }, []);

    const highlightStation = useCallback((stationId) => {
        setHighlightedStationId(String(stationId));

        if (highlightTimeoutRef.current) {
            clearTimeout(highlightTimeoutRef.current);
        }

        highlightTimeoutRef.current = setTimeout(() => {
            setHighlightedStationId(null);
            highlightTimeoutRef.current = null;
        }, 4000);
    }, []);

     /**
     * Pan/zoom to a station.
     */
    const goToStation = useCallback((station) => {
        if (!station || !leafletMapRef.current) return;

        leafletMapRef.current.setView([station.lat, station.lon], 16);
        setStationQuery("");
        setFocusedStation(station);
        highlightStation(station.id);
    }, [highlightStation, leafletMapRef]);

    const clearFocusedStation = useCallback(() => {
        setFocusedStation(null);
    }, []);

    const stationMatches = useMemo(() => {
        const query = stationQuery.trim().toLowerCase();

        if (query.length === 0) return [];

        return stationsForSearch
            .filter((station) => (station.name || "").toLowerCase().includes(query))
            .slice(0, 8);
    }, [stationQuery, stationsForSearch]);

    const selectFirstStationMatch = useCallback(() => {
        if (stationMatches.length > 0) goToStation(stationMatches[0]);
    }, [stationMatches, goToStation]);

    return {
        stationQuery,
        setStationQuery,
        stationMatches,
        handleStationsLoaded,
        goToStation,
        selectFirstStationMatch,
        focusedStation,
        clearFocusedStation,
        highlightedStationId,
        setHighlightedStationId,
    };
}
