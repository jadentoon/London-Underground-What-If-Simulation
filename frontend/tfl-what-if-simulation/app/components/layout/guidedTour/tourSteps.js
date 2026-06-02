/**
 * Declarative guided-tour step configuration.
 *
 * Each step identifies a target element, instruction text, completion
 * condition and optional follow-up action. Keeping this data separate from the
 * controller makes the tour sequence easier to adjust without touching overlay
 * positioning or event-listener logic.
 */
export const steps = [
    {
        id: "sidebar-toggle",
        title: "Sidebar",
        description: "Use this button to open the sidebar controls.",
        targetSelector: "button[aria-label='Toggle sidebar']",
        undimSelector: "[data-tour='sidebar']",
        completion: {
            type: "attribute",
            selector: "button[aria-label='Toggle sidebar']",
            attribute: "aria-expanded",
            equals: "true",
            interaction: { type: "click", selector: "button[aria-label='Toggle sidebar']" },
        },
        boxNudgeX: 0,
        boxNudgeY: 0,
    },
    {
        id: "show-trains",
        title: "Train Display",
        description: "You can hide the train from the map using this button",
        targetSelector: "[data-tour='show-trains-toggle']",
        undimSelector: "[data-tour='sidebar']",
        completion: {
            type: "attribute",
            selector: "[data-tour='show-trains-toggle']",
            attribute: "aria-pressed",
            equals: "false",
            interaction: { type: "click", selector: "[data-tour='show-trains-toggle']" },
        },
        afterComplete: {
            type: "click",
            selector: "[data-tour='show-trains-toggle']",
            delayMs: 120,
            waitFor: {
                type: "attribute",
                selector: "[data-tour='show-trains-toggle']",
                attribute: "aria-pressed",
                equals: "true",
                timeoutMs: 1500,
            },
        },
        advanceDelayMs: 650,
        boxNudgeX: 0,
        boxNudgeY: 0,
    },
    {
        id: "line-status",
        title: "Line Status",
        description: "Click a line to see more details.",
        targetSelector: "[data-tour='line-status-button']",
        undimSelector: "[data-tour='sidebar']",
        completion: {
            type: "event",
            selector: "[data-tour='line-status-button']",
            event: "click",
        },
        afterComplete: {
            type: "click",
            selector: "button[aria-label='Toggle sidebar']",
            delayMs: 650,
            waitFor: {
                type: "attribute",
                selector: "button[aria-label='Toggle sidebar']",
                attribute: "aria-expanded",
                equals: "false",
                timeoutMs: 2000,
            },
        },
        scrollIntoView: true,
        boxNudgeX: 0,
        boxNudgeY: 0,
    },
    {
        id: "search-box",
        title: "Search",
        description: "Search for stations here.",
        targetSelector: "[data-tour='station-search-trigger']",
        undimSelector: "[data-tour='station-search-container']",
        completion: {
            type: "event",
            selector: "[data-tour='station-search-trigger']",
            event: "click",
        },
        afterComplete: {
            type: "click",
            selector: "[data-tour='station-search-hide']",
            delayMs: 650,
        },
        advanceDelayMs: 1100,
        boxNudgeX: 0,
        boxNudgeY: 0,
    },
    {
        id: "what-if-toggle",
        title: "What-If Mode",
        description: "Toggle What-If mode to start simulating closures.",
        targetSelector: "button[aria-label='Toggle What-If Mode']",
        undimSelector: "[data-tour='what-if-toggle-container']",
        completion: {
            type: "attribute",
            selector: "button[aria-label='Toggle What-If Mode']",
            attribute: "aria-pressed",
            equals: "true",
            interaction: { type: "click", selector: "button[aria-label='Toggle What-If Mode']" },
        },
        boxNudgeX: 0,
        boxNudgeY: 0,
    },
    {
        id: "map-controls",
        title: "Map Controls",
        description: "Expand this box to see more information about how to interact with the map.",
        targetSelector: "[data-tour='map-controls-show-button']",
        undimSelector: "[data-tour='map-controls-box']",
        completion: {
            type: "event",
            selector: "[data-tour='map-controls-show-button']",
            event: "click",
        },
        advanceDelayMs: 1500,
        boxNudgeX: 0,
        boxNudgeY: 0,
    },
    {
        id: "tour-complete",
        title: "Tour Complete!",
        description: "You've learned the basics. Explore the app to discover more features.",
        undimSelector: "[data-tour='map-controls-box']",
        completion: {
            type: "event",
            selector: "body",
            event: "keydown",
        },
        boxNudgeX: 0,
        boxNudgeY: 0,
    },
];
