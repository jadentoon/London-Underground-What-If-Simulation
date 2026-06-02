import { useCallback, useState } from "react";

/**
 * Manages route panel state, route summaries and routing errors.
 * 
 * The panel opens automatically when a valid route is received and can be
 * collapsed, toggled or cleared by map controls.
 * 
 * @returns {Object} Route panel state and actions for updating or clearing route UI.
 */
export function useRoutePanel() {
    const [routingError, setRoutingError] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [isRoutePanelOpen, setIsRoutePanelOpen] = useState(false);

     const handleRouteChange = useCallback((info) => {
        setRouteInfo(info);

        setIsRoutePanelOpen((prevOpen) => {
            const nextOpen = !!info?.hasPath;
            return prevOpen === nextOpen ? prevOpen : nextOpen;
        });
    }, []);

    const toggleRoutePanel = useCallback(() => {
        setIsRoutePanelOpen((value) => !value);
    }, []);

    const collapseRoutePanel = useCallback(() => {
        setIsRoutePanelOpen(false);
    }, []);

    const clearRoutePanel = useCallback(() => {
        setRoutingError(null);
        setRouteInfo(null);
        setIsRoutePanelOpen(false);
    }, []);

    return {
        routingError,
        setRoutingError,
        routeInfo,
        isRoutePanelOpen,
        handleRouteChange,
        toggleRoutePanel,
        collapseRoutePanel,
        clearRoutePanel,
    };
}
