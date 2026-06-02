import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Manages station search, focused station state and map navigation from search.
 * 
 * Stores searchable station data after the graph loads, filters matches from
 * the current query, pans the Leaflet map to selected stations and temporarily
 * highlights the selected marker.
 * 
 * @param {React.MutableRefObject<Object|null>} leafletMapRef - Ref containing the Leaflet map instance.
 * @returns {Object} Search query state, station matches, focus state and search actions.
 */
export function useStationSearch(leafletMapRef) {
    // Stations list for search (filled by LeafletMap once loaded)
    const [stationsForSearch, setStationsForSearch] = useState([]);

    //Search input value
    const [stationQuery, setStationQuery] = useState("");

    // Highlighted station after search selection
    const [highlightedStationId, setHighlightedStationId] = useState(null);
    const [focusedStation, setFocusedStation] = useState(null);
    const [focusedStationSource, setFocusedStationSource] = useState(null);
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
    const setCurrentStation = useCallback((station, source = "map") => {
        setFocusedStation(station ?? null);
        setFocusedStationSource(station ? source : null);
    }, []);

    const goToStation = useCallback((station) => {
        if (!station || !leafletMapRef.current) return;

        leafletMapRef.current.setView([station.lat, station.lon], 16);
        setStationQuery("");
        setCurrentStation(station, "search");
        highlightStation(station.id);
    }, [highlightStation, leafletMapRef, setCurrentStation]);

    const clearFocusedStation = useCallback(() => {
        setCurrentStation(null);
    }, [setCurrentStation]);

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
        focusedStationSource,
        clearFocusedStation,
        setCurrentStation,
        highlightedStationId,
        setHighlightedStationId,
    };
}
