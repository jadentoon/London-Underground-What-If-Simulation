/**
 * Injects global Leaflet control styles for the map.
 *
 * Leaflet renders zoom controls outside the React component tree, so this
 * component supplies theme-aware global CSS for the built-in zoom buttons.
 *
 * @param {Object} props - Leaflet chrome props.
 * @param {Object} props.COLORS - Theme tokens used by the zoom controls.
 * @param {string} props.accentColor - Accent colour for zoom button text.
 * @returns {JSX.Element} Global style block for Leaflet controls.
 */

export function MapLeafletChrome({ COLORS, accentColor }) {
    return (
        <style jsx global>{`
            .leaflet-control-zoom {
                position: fixed !important;
                top: 50% !important;
                right: 16px !important;
                left: auto !important;
                transform: translateY(-50%);
                border: none !important;
                box-shadow: none !important;
            }
            
            .leaflet-control-zoom a {
                background: ${COLORS.card} !important;
                backdrop-filter: blur(8px);
                border: 1px solid ${COLORS.border} !important;
                color: ${accentColor} !important;
                width: 40px !important;
                height: 40px !important;
                line-height: 40px !important;
                font-size: 20px !important;
                transition: all 0.2s ease !important;
            }
            
            .leaflet-control-zoom a:first-child {
                border-radius: 8px 8px 0 0 !important;
                border-bottom: none !important;
            }
            
            .leaflet-control-zoom a:last-child {
                border-radius: 0 0 8px 8px !important;
            }
            
            .leaflet-control-zoom a:hover {
                background: ${COLORS.hover} !important;
                color: ${accentColor} !important;
            }
            
            @keyframes flash {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.2; }
            }
        `}</style>
    );
}
