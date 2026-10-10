import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
export const TrafficMap = ({ corridors, height = '460px' }) => {
    // Determine center based on corridors or default to Hyderabad
    const defaultCenter = [17.42, 78.43];
    const center = corridors.length > 0 && corridors[0].latitude && corridors[0].longitude
        ? [corridors[0].latitude, corridors[0].longitude]
        : defaultCenter;
    const getCongestionColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'severe': return '#EF4444';
            case 'high': return '#F59E0B';
            case 'moderate': return '#38BDF8';
            case 'low': return '#10B981';
            default: return '#14B8A6';
        }
    };
    return (_jsxs("div", { style: { height, width: '100%', position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }, children: [_jsxs(MapContainer, { center: center, zoom: 12, scrollWheelZoom: false, style: { height: '100%', width: '100%', background: '#0B1220' }, children: [_jsx(TileLayer, { attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors \u00A9 <a href="https://carto.com/">CARTO</a>', url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" }), corridors.map((c) => {
                        if (!c.latitude || !c.longitude)
                            return null;
                        const color = getCongestionColor(c.dominant_congestion);
                        return (_jsx(CircleMarker, { center: [c.latitude, c.longitude], radius: 9, pathOptions: {
                                color: '#FFFFFF',
                                weight: 1.5,
                                fillColor: color,
                                fillOpacity: 0.85,
                            }, children: _jsx(Popup, { className: "custom-map-popup", children: _jsxs("div", { style: { minWidth: '180px', padding: '4px' }, children: [_jsx("h4", { style: { margin: '0 0 4px 0', fontSize: '0.9rem', color: '#F8FAFC' }, children: c.segment_name }), _jsxs("div", { style: { fontSize: '0.75rem', color: '#94A3B8', marginBottom: '8px' }, children: [c.road_type || 'Arterial Corridor', " \u2022 ID: ", c.segment_id] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.78rem' }, children: [_jsxs("div", { children: [_jsx("span", { style: { color: '#64748B' }, children: "Avg Speed:" }), _jsx("br", {}), _jsxs("strong", { style: { color: '#F8FAFC' }, children: [c.avg_speed, " km/h"] })] }), _jsxs("div", { children: [_jsx("span", { style: { color: '#64748B' }, children: "Volume:" }), _jsx("br", {}), _jsxs("strong", { style: { color: '#F8FAFC' }, children: [c.avg_volume, " veh/h"] })] })] }), _jsxs("div", { style: { marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("span", { style: { fontSize: '0.72rem', color: '#94A3B8' }, children: [c.observation_count, " obs"] }), _jsx("span", { className: `badge badge-${c.dominant_congestion?.toLowerCase() || 'neutral'}`, children: c.dominant_congestion })] })] }) }) }, c.segment_id));
                    })] }), _jsxs("div", { style: {
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    backgroundColor: 'rgba(17, 28, 46, 0.92)',
                    border: '1px solid var(--border-color)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    zIndex: 1000,
                    boxShadow: 'var(--shadow-md)',
                    fontSize: '0.75rem',
                }, children: [_jsx("div", { style: { fontWeight: 600, color: '#F8FAFC', marginBottom: '6px' }, children: "Congestion Severity" }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("span", { style: { width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' } }), _jsx("span", { children: "Low (> 38 km/h)" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("span", { style: { width: '10px', height: '10px', borderRadius: '50%', background: '#38BDF8' } }), _jsx("span", { children: "Moderate (28 - 38 km/h)" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("span", { style: { width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' } }), _jsx("span", { children: "High (18 - 28 km/h)" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("span", { style: { width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' } }), _jsx("span", { children: "Severe (< 18 km/h)" })] })] })] })] }));
};
