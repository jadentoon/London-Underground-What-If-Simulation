import { useCallback, useMemo, useState } from "react";

export function useStationSearch(leafletMapRef) {
    // Stations list for search (filled by LeafletMap once loaded)
    const [stationsForSearch, setStationsForSearch] = useState([]);

    //Search input value
    const [stationQuery, setStationQuery] = useState("");

    // Highlighted station after search selection
    const [highlightedStationId, setHighlightedStationId] = useState(null);

    const handleStationsLoaded = useCallback((nodes) => {
        setStationsForSearch(nodes || []);
    }, []);

     /**
     * Pan/zoom to a station.
     */
    const goToStation = useCallback((station) => {
        if (!station || !leafletMapRef.current) return;

        leafletMapRef.current.setView([station.lat, station.lon], 16);
        setStationQuery(station.name);

        // highlight searched station
        setHighlightedStationId(String(station.id));

        // remove highlight after a few seconds
        setTimeout(() => {
            setHighlightedStationId(null);
        }, 4000);
    }, [leafletMapRef]);

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
        highlightedStationId,
        setHighlightedStationId,
    };
}