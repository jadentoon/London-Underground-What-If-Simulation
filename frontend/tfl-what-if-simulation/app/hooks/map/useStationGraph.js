import { useEffect, useMemo, useState } from "react";
import { buildGraph } from "../../lib/graph.js";
import { buildNodeById } from "../../components/mapShared/utils.js";

/**
 * Loads and prepares the station graph used by the Leaflet map.
 *
 * Fetches station nodes and connection edges from `/api/stations`, builds a
 * fast station lookup map, and converts the raw node/edge data into the graph
 * structure expected by the pathfinding code.
 *
 * @param {Object} [options] - Hook configuration.
 * @param {(stations: Array<Object>) => void} [options.onStationsLoaded]
 * Callback fired after station data is loaded. Used by parent components to
 * populate search/autocomplete state.
 *
 * @returns {Object} Station graph state and derived lookup structures.
 * @returns {Array<Object>} returns.nodes - Station nodes returned by the API.
 * @returns {Array<Object>} returns.edges - Station connection edges returned by the API.
 * @returns {Map<string, Object>} returns.nodeById - Station lookup map keyed by station id.
 * @returns {Object|null} returns.graph - Pathfinding graph, or null before data is loaded.
 */
export function useStationGraph({ onStationsLoaded } = {}) {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    useEffect(() => {
        let alive = true;

        /**
        * Fetches station graph data from the API and stores it in local hook state.
        *
        * The `alive` guard prevents state updates after the component using this hook
        * has unmounted while the request is still in flight.
        *
        * @returns {Promise<void>}
        */
        async function loadStations() {
            const res = await fetch("/api/stations");
            const data = await res.json();

            if (!alive) return;

            const nextNodes = data.nodes || [];
            const nextEdges = data.edges || [];

            setNodes(nextNodes);
            setEdges(nextEdges);
            onStationsLoaded?.(nextNodes);
        };

        loadStations();

        return () => {
            alive = false;
        };
    }, [onStationsLoaded]);

    /**
    * Fast station lookup keyed by station id.
    *
    * Used by routing, highlighting, and station metadata lookups.
    *
    * @type {Map<string, Object>}
    */
    const nodeById = useMemo(() => buildNodeById(nodes), [nodes]);

    const graph = useMemo(() => {
        if (!nodes.length || !edges.length) return null;
        return buildGraph(nodes, edges);
    }, [nodes, edges]);

    return {
        nodes,
        edges,
        nodeById,
        graph,
    }
}