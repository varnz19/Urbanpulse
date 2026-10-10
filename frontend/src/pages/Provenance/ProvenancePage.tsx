import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { NavLink } from 'react-router-dom';

export const ProvenancePage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Dataset Provenance & Methodology"
        description="Comprehensive documentation of geographic origin, data collection protocols, schema definitions, and data privacy principles."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Geographic Scope: Hyderabad, India</div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
            The primary benchmark corpus represents 12 critical arterial corridors across the Greater Hyderabad Metropolitan Area in Telangana, India. The selection covers high-density IT sectors, transit interchanges, commercial corridors, and outer express corridors:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
            {[
              { id: 'HYD-COR-01', name: 'HITEC City - Cyber Towers Junction', lat: 17.4504, lon: 78.3808, type: 'Tech Corridor' },
              { id: 'HYD-COR-02', name: 'Gachibowli - ORR Junction', lat: 17.4401, lon: 78.3489, type: 'Express Corridor' },
              { id: 'HYD-COR-03', name: 'Jubilee Hills - Checkpost', lat: 17.4319, lon: 78.4073, type: 'Arterial' },
              { id: 'HYD-COR-04', name: 'Banjara Hills - Road No. 12', lat: 17.4156, lon: 78.4350, type: 'Commercial Avenue' },
              { id: 'HYD-COR-05', name: 'Panjagutta - Central Circle', lat: 17.4260, lon: 78.4526, type: 'Arterial' },
              { id: 'HYD-COR-06', name: 'Begumpet - Flyover Corridor', lat: 17.4447, lon: 78.4664, type: 'Arterial' },
              { id: 'HYD-COR-07', name: 'Secunderabad - Clock Tower', lat: 17.4411, lon: 78.4983, type: 'Urban Core' },
              { id: 'HYD-COR-08', name: 'Mehdipatnam - Rythu Bazar', lat: 17.3916, lon: 78.4414, type: 'Transit Hub' },
              { id: 'HYD-COR-09', name: 'Dilsukhnagar - Bus Depot Arterial', lat: 17.3688, lon: 78.5247, type: 'Commercial Avenue' },
              { id: 'HYD-COR-10', name: 'LB Nagar - Ring Road Junction', lat: 17.3457, lon: 78.5522, type: 'Ring Road' },
              { id: 'HYD-COR-11', name: 'Financial District - Wipro Circle', lat: 17.4182, lon: 78.3418, type: 'Tech Corridor' },
              { id: 'HYD-COR-12', name: 'Madhapur - 100ft Road', lat: 17.4485, lon: 78.3908, type: 'Commercial Avenue' },
            ].map((c) => (
              <div key={c.id} style={{ background: 'var(--bg-surface-elevated)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.82rem' }}>{c.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  {c.id} • {c.lat.toFixed(4)}, {c.lon.toFixed(4)} ({c.type})
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Canonical Data Schema</div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Unit / Categories</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>timestamp</code></td>
                  <td>ISO 8601 string</td>
                  <td>YYYY-MM-DD HH:MM:SS</td>
                  <td>Observation time timestamp</td>
                </tr>
                <tr>
                  <td><code>segment_id</code></td>
                  <td>String</td>
                  <td>HYD-COR-01 to HYD-COR-12</td>
                  <td>Unique arterial identifier</td>
                </tr>
                <tr>
                  <td><code>latitude, longitude</code></td>
                  <td>Float</td>
                  <td>WGS84 Coordinates</td>
                  <td>Spatial coordinates of the corridor midpoint</td>
                </tr>
                <tr>
                  <td><code>avg_speed_kmh</code></td>
                  <td>Numeric float</td>
                  <td>Kilometers per hour (km/h)</td>
                  <td>Observed average motorized vehicle velocity</td>
                </tr>
                <tr>
                  <td><code>vehicle_count</code></td>
                  <td>Numeric integer</td>
                  <td>Vehicles per hour (veh/h)</td>
                  <td>Volume throughput across observation window</td>
                </tr>
                <tr>
                  <td><code>weather</code></td>
                  <td>Nominal</td>
                  <td>Clear, Overcast, Rainy</td>
                  <td>Meteorological ambient state</td>
                </tr>
                <tr>
                  <td><code>congestion_level</code></td>
                  <td>Target Nominal</td>
                  <td>Low, Moderate, High, Severe</td>
                  <td>Classified congestion status based on speed thresholds</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Privacy & Legal Policies</div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <p style={{ marginBottom: '8px' }}>
              UrbanPulse processes only aggregated macroscopic traffic sensor speeds and vehicle counts. No personally identifiable information (PII) or GPS tracks are collected.
            </p>
            <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
              <NavLink to="/terms" className="btn btn-secondary" style={{ fontSize: '0.78rem' }}>View Terms of Service</NavLink>
              <NavLink to="/privacy" className="btn btn-secondary" style={{ fontSize: '0.78rem' }}>View Privacy Policy</NavLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
