import { ReactNode } from 'react';

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate'|'green'|'amber'|'red'|'blue'|'violet' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function SectionTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="section-title-wrap">
    <div>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h2 className="section-title">{title}</h2>
      {description && <p className="section-desc">{description}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
}

export function MetricCard({ label, value, meta, icon, accent = false }: { label: string; value: string|number; meta?: string; icon?: ReactNode; accent?: boolean }) {
  return <div className={`metric-card ${accent ? 'metric-card-accent' : ''}`}>
    <div className="metric-top"><span>{label}</span>{icon && <span className="metric-icon">{icon}</span>}</div>
    <div className="metric-value">{value}</div>
    {meta && <div className="metric-meta">{meta}</div>}
  </div>
}

export function Progress({ value }: { value:number }) {
  return <div className="progress"><span style={{ width: `${Math.min(value,100)}%` }} /></div>
}
