import L from "leaflet";
import "leaflet/dist/leaflet.css";


export function setupLeafletDefaultIcons() {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
}

export function createRedXIcon(zoom = 14) {

    const z = Math.min(16, Math.max(12, Math.round(zoom)));

    const sizes = {
        12: 32,
        13: 36,
        14: 40,
        15: 44,
        16: 48,
    };

    const size = sizes[z] ?? 40;

    return L.divIcon({
        className: 'custom-red-x-icon',
        html: `
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: ${size}px;
                    height: ${size}px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: ${size}px;
                    font-weight: bold;
                    color: #ef4444;
                    text-shadow: 0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(239, 68, 68, 0.5);
                    pointer-events: none;
                    z-index: 1000;
                ">✕</div>
            `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}