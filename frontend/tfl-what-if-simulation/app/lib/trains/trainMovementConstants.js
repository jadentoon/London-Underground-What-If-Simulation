/**
 * Shared timing, limit and threshold constants for live and fallback train movement.
 * 
 * Keeping these values in one file makes the animation, polling, snapshot and 
 * fallback logic easier to tune without hunting through the hook implementation.
 */

export const LIVE_REFRESH_MS = 100_000;
export const ANIMATION_TICK_MS = 1000;
export const MAX_LIVE_ETA_SECONDS = 480;
export const MAX_ROUTE_ETA_SECONDS = 3600;
export const MAX_LIVE_TRAINS = 500;
export const FALLBACK_TRAINS_PER_LINE = 5;
export const MIN_EDGE_TRAVEL_TIME_SECONDS = 60;
export const SNAPSHOT_CARRYOVER_MS = 180_000;
export const PUNCTUALITY_THRESHOLD_SECONDS = 20;
