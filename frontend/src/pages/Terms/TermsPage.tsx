import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';

export const TermsPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Terms of Service"
        description="Operational terms, licensing limitations, and acceptable use guidelines governing the UrbanPulse platform."
      />

      <div className="card" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <section>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '8px' }}>1. Platform Purpose & Scope</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            UrbanPulse is an analytical decision-support and traffic data mining system intended for municipal transportation researchers, mobility engineers, and academic traffic evaluation. It evaluates historical observation records and mathematical data mining outputs.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '8px' }}>2. Analytical Decision Support Disclaimer</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Calculations, clustering partitions, association rules, and anomaly scores represent empirical mathematical models fitted to historical datasets. Outputs do not constitute physical traffic dispatch guarantees, legal road status certifications, or automated emergency response triggers.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '8px' }}>3. Data Ingestion & Ownership</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Users retain full rights to any uploaded CSV or ARFF datasets. Users represent and warrant that uploaded datasets contain no classified material, unauthorized surveillance telemetry, or individual personally identifiable information (PII).
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '8px' }}>4. Limitation of Liability</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            The platform is provided "as is" without warranty of any kind, express or implied. Under no circumstances shall the maintainers be liable for any direct, indirect, incidental, or consequential damages resulting from operational decisions made using model projections.
          </p>
        </section>
      </div>
    </div>
  );
};
