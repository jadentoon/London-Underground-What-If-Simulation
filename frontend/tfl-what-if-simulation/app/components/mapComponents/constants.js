export const LONDON_CENTER = [51.5074, -0.1278]; // default center (London coordinates)

export const SEP = "__";

// Line styling constants
export const LINE_STYLE = {
    OUTLINE_COLOR: "#ffffff",
    OUTLINE_WEIGHT: 8,
    STROKE_WEIGHT: 4,
    OPACITY: 0.8,
    SMOOTH_FACTOR: 5,
    OFFSET_STEP: 0.00015,           // Offset step for parallel lines in degrees
    CLOSED_LINE_COLOUR: "#ffffff",   // bright white core for closed lines
    CLOSED_LINE_OUTLINE: "#ff1a1a"  // red outline for closed lines
};             

// TfL Line colors (official Transport for London colors)
export const LINE_COLOURS = {
    "bakerloo": "#B36305",
    "central": "#E32017",
    "circle": "#FFD300",
    "district": "#00782A",
    "hammersmith-city": "#F3A9BB",
    "jubilee": "#A0A5A9",
    "metropolitan": "#9B0056",
    "northern": "#000000",
    "piccadilly": "#003688",
    "victoria": "#0098D4",
    "waterloo-city": "#95CDBA",
};

// Precomputed train marker colours (slightly darker/more saturated than line colours)
export const TRAIN_COLOURS = {
    "bakerloo": "#ac5a00",
    "central": "#dd150c",
    "circle": "#f2c500",
    "district": "#007424",
    "hammersmith-city": "#e094a7",
    "jubilee": "#8f9599",
    "metropolitan": "#95004e",
    "northern": "#000000",
    "piccadilly": "#002f84",
    "victoria": "#008dca",
    "waterloo-city": "#82bca8",
};

// Line display labels
export const LINE_LABELS = {
    "bakerloo": "Bakerloo",
    "central": "Central",
    "circle": "Circle",
    "district": "District",
    "hammersmith-city": "Hammersmith & City",
    "jubilee": "Jubilee",
    "metropolitan": "Metropolitan",
    "northern": "Northern",
    "piccadilly": "Piccadilly",
    "victoria": "Victoria",
    "waterloo-city": "Waterloo & City",
};

/**
 * zoom level 12 - radius 5
 * zoom level 13 - radius 7
 * zoom level 14 - radius 9
 * zoom level 15 - radius 11
 * zoom level 16 - radius 13
 */
export const ZOOM_LEVELS = {
    12: 7,
    13: 9,
    14: 11,
    15: 13,
    16: 15
}