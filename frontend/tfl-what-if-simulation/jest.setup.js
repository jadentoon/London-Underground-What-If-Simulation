import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Leaflet to avoid canvas-related errors
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  CircleMarker: () => <div data-testid="circle-marker" />,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    setView: jest.fn(),
    getZoom: jest.fn(() => 12),
    getCenter: jest.fn(() => ({ lat: 51.5, lng: -0.1 })),
  }),
}));

// Mock leaflet itself
jest.mock('leaflet', () => ({
  icon: jest.fn((options) => options),
  LatLng: jest.fn((lat, lng) => ({ lat, lng })),
  LatLngBounds: jest.fn((corner1, corner2) => ({ corner1, corner2 })),
}));
