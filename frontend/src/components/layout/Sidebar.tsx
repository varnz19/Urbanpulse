import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Database, Activity, Network,
  BrainCircuit, GitPullRequest, AlertTriangle, FlaskConical,
  FileText, Compass
} from 'lucide-react';

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
          <LayoutDashboard size={18} />
          <span>Command Center</span>
        </NavLink>
        <NavLink to="/patterns" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Activity size={18} />
          <span>Pattern Explorer</span>
        </NavLink>
        <NavLink to="/segments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Network size={18} />
          <span>Segment Intelligence</span>
        </NavLink>

        <div className="nav-section-title">Data Mining & ML</div>
        <NavLink to="/classification" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BrainCircuit size={18} />
          <span>Classification & Rules</span>
        </NavLink>
        <NavLink to="/association" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <GitPullRequest size={18} />
          <span>Association Mining</span>
        </NavLink>
        <NavLink to="/anomalies" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <AlertTriangle size={18} />
          <span>Anomaly Monitor</span>
        </NavLink>

        <div className="nav-section-title">Workspace & Reports</div>
        <NavLink to="/datasets" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Database size={18} />
          <span>Datasets & Prep</span>
        </NavLink>
        <NavLink to="/experiments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FlaskConical size={18} />
          <span>Experiment Center</span>
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileText size={18} />
          <span>Insight Reports</span>
        </NavLink>
        <NavLink to="/provenance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Compass size={18} />
          <span>Dataset Provenance</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <span>v1.0 • Hyderabad Pilot</span>
        <span style={{ color: 'var(--accent-teal)' }}>● Online</span>
      </div>
    </aside>
  );
};
