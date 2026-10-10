import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { CorridorGeoItem } from '../../types';

interface TrafficMapProps {
  corridors: CorridorGeoItem[];
  height?: string;
}

export const TrafficMap: React.FC<TrafficMapProps> = ({ corridors, height = '440px' }) => {
  const defaultCenter: [number, number] = [17.42, 78.43];
  const center: [number, number] = corridors.length > 0 && corridors[0].latitude && corridors[0].longitude
    ? [corridors[0].latitude, corridors[0].longitude]
    : defaultCenter;

  const getCongestionColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'severe': return '#DC2626';
      case 'high': return '#D97706';
      case 'moderate': return '#0284C7';
      case 'low': return '#059669';
      default: return '#0D9488';
    }
  };

  return (
    <div style={{ height, width: '100%', position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', background: '#0B1220' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {corridors.map((c) => {
          if (!c.latitude || !c.longitude) return null;
          const color = getCongestionColor(c.dominant_congestion);

          return (
            <CircleMarker
              key={c.segment_id}
              center={[c.latitude, c.longitude]}
              radius={8}
              pathOptions={{
                color: '#1E293B',
                weight: 1.5,
                fillColor: color,
                fillOpacity: 0.9,
              }}
            >
              <Popup className="custom-map-popup">
                <div style={{ minWidth: '180px', padding: '2px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#F8FAFC', marginBottom: '3px' }}>
                    {c.segment_name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: '8px' }}>
                    {c.road_type || 'Arterial Corridor'} • ID: {c.segment_id}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem' }}>
                    <div>
                      <span style={{ color: '#64748B' }}>Avg Speed:</span><br />
                      <strong style={{ color: '#F8FAFC' }}>{c.avg_speed} km/h</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>Volume:</span><br />
                      <strong style={{ color: '#F8FAFC' }}>{c.avg_volume} veh/h</strong>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{c.observation_count} obs</span>
                    <span className={`badge badge-${c.dominant_congestion?.toLowerCase() || 'neutral'}`}>
                      {c.dominant_congestion}
                    </span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay - No Drop Shadows, Sharp Radius */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        backgroundColor: '#111C2E',
        border: '1px solid var(--border-color)',
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm)',
        zIndex: 1000,
        fontSize: '0.72rem',
      }}>
        <div style={{ fontWeight: 600, color: '#F8FAFC', marginBottom: '6px' }}>Congestion State</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', background: '#059669' }} />
            <span>Low (&gt; 38 km/h)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', background: '#0284C7' }} />
            <span>Moderate (28 - 38 km/h)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', background: '#D97706' }} />
            <span>High (18 - 28 km/h)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', background: '#DC2626' }} />
            <span>Severe (&lt; 18 km/h)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
