import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';

export const PrivacyPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Privacy Policy"
        description="Formal disclosure regarding data processing, local computational boundaries, and absence of personal tracking telemetry."
      />

      <div className="card" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <section>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '8px' }}>1. Zero Personally Identifiable Information (PII)</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            UrbanPulse strictly processes macroscopic traffic sensor observations: vehicle speeds (km/h), volume throughputs (veh/h), timestamps, road segment classifications, and spatial road coordinates. The platform does not ingest, parse, store, or transmit individual driver identities, license plate records (ALPR), cellular positioning pings, or individual MAC addresses.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '8px' }}>2. Local Processing & Isolation</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            All computations, machine learning model trainings, and preprocessing pipelines are executed locally or inside user-provisioned containers. Dataset records are never routed to third-party ad networks, telemetry trackers, or external cloud LLM APIs.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '8px' }}>3. Cookies & Tracking Technologies</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            This application uses no tracking cookies, advertising identifiers, or analytics trackers. Session states are stored strictly in local browser memory and in your configured local database.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '8px' }}>4. Retention & Deletion</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Uploaded datasets are stored in the local storage directory and may be purged at any time by the system administrator or through standard file system cleanup.
          </p>
        </section>
      </div>
    </div>
  );
};
