import { useEffect, useState } from "react";

const DEFAULT_STATE = {
    width: 0,
    height: 0,
    isPortrait: false,
    isMobile: false,
    isLargeDesktop: false,
};

/**
 * Tracks the current browser viewport size and responsive layout flags.
 * 
 * Used by map layout components to switch between mobile, portrait and large
 * desktop behaviours without duplicating resize logic.
 * 
 * @returns {{
 *  width: number,
 *  height: number,
 *  isPortrait: boolean,
 *  isMobile: boolean,
 *  isLargeDesktop: boolean
 * }} Current viewport state.
 */
function getViewportState() {
    if (typeof window === "undefined") return DEFAULT_STATE;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height >= width;
    const isMobile = width <= 768;
    const isLargeDesktop = width >= 1440;

    return {
        width,
        height,
        isPortrait,
        isMobile,
        isLargeDesktop,
    };
}

export function useViewport() {
    const [state, setState] = useState(DEFAULT_STATE);

    useEffect(() => {
        const update = () => {
            setState(getViewportState());
        };

        update();
        window.addEventListener("resize", update);

        return () => window.removeEventListener("resize", update);
    }, []);

    return state;
}
