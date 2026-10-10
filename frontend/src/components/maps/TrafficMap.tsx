import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { CorridorGeoItem } from '../../types';

interface TrafficMapProps {
  corridors: CorridorGeoItem[];
  height?: string;
}

export const TrafficMap: React.FC<TrafficMapProps> = ({ corridors, height = '460px' }) => {
  // Determine center based on corridors or default to Hyderabad
  const defaultCenter: [number, number] = [17.42, 78.43];
  const center: [number, number] = corridors.length > 0 && corridors[0].latitude && corridors[0].longitude
    ? [corridors[0].latitude, corridors[0].longitude]
    : defaultCenter;

  const getCongestionColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'severe': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'moderate': return '#38BDF8';
      case 'low': return '#10B981';
      default: return '#14B8A6';
    }
  };

  return (
    <div style={{ height, width: '100%', position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', background: '#0B1220' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {corridors.map((c) => {
          if (!c.latitude || !c.longitude) return null;
          const color = getCongestionColor(c.dominant_congestion);

          return (
            <CircleMarker
              key={c.segment_id}
              center={[c.latitude, c.longitude]}
              radius={9}
              pathOptions={{
                color: '#FFFFFF',
                weight: 1.5,
                fillColor: color,
                fillOpacity: 0.85,
              }}
            >
              <Popup className="custom-map-popup">
                <div style={{ minWidth: '180px', padding: '4px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#F8FAFC' }}>
                    {c.segment_name}
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '8px' }}>
                    {c.road_type || 'Arterial Corridor'} • ID: {c.segment_id}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.78rem' }}>
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
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{c.observation_count} obs</span>
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

      {/* Map Legend Overlay */}
      <div style={{
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
      }}>
        <div style={{ fontWeight: 600, color: '#F8FAFC', marginBottom: '6px' }}>Congestion Severity</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
            <span>Low (&gt; 38 km/h)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38BDF8' }} />
            <span>Moderate (28 - 38 km/h)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} />
            <span>High (18 - 28 km/h)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }} />
            <span>Severe (&lt; 18 km/h)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
