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

export function createRedXIcon() {
    return L.divIcon({
        className: 'custom-red-x-icon',
        html: `
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                    font-weight: bold;
                    color: #ef4444;
                    text-shadow: 0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(239, 68, 68, 0.5);
                    pointer-events: none;
                    z-index: 1000;
                ">✕</div>
            `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
}