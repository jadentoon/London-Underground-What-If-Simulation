import { useCallback, useState } from "react";

export function useRoutePanel() {
     // State for routing errors
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

    return {
        routingError,
        setRoutingError,
        routeInfo,
        isRoutePanelOpen,
        handleRouteChange,
        toggleRoutePanel,
    };
}