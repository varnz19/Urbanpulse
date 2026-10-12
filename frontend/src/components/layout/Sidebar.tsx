import React from 'react';
import { NavLink } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">UP</div>
        <div>
          <div className="brand-title">UrbanPulse</div>
          <div className="brand-subtitle">Mobility Intelligence</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Core Analytics</div>
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>Command Center</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>01</span>
        </NavLink>
        <NavLink to="/patterns" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>Pattern Explorer</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>02</span>
        </NavLink>
        <NavLink to="/segments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>Segment Intelligence</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>03</span>
        </NavLink>

        <div className="nav-section-title">Data Mining & ML</div>
        <NavLink to="/classification" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>Classification Models</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>04</span>
        </NavLink>
        <NavLink to="/association" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>Association Mining</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>05</span>
        </NavLink>
        <NavLink to="/anomalies" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>Anomaly Monitor</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>06</span>
        </NavLink>

        <div className="nav-section-title">Workspace & Reports</div>
        <NavLink to="/datasets" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>Datasets & Prep</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>07</span>
        </NavLink>
        <NavLink to="/experiments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>Experiment Center</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>08</span>
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>Insight Reports</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>09</span>
        </NavLink>
        <NavLink to="/provenance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>Provenance & Method</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>10</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <span>Status: Operational</span>
          <span style={{ color: 'var(--accent-teal)' }}>v1.0</span>
        </div>
      </div>
    </aside>
  );
};
