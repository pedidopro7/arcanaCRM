'use client';

import { ReactNode } from 'react';
import { ArrowUpRight, X } from './icons';

export type Tone = 'slate'|'green'|'amber'|'red'|'blue'|'violet'|'coral';

export function Badge({ children, tone='slate', icon }: { children:ReactNode; tone?:Tone; icon?:ReactNode }) {
  return <span className={`badge badge-${tone}`}>{icon}{children}</span>;
}

export function PageHeader({ eyebrow, title, description, action, secondary }: { eyebrow?:string; title:string; description?:string; action?:ReactNode; secondary?:ReactNode }) {
  return <div className="page-head">
    <div className="page-head-copy">{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h1 className="page-title">{title}</h1>{description&&<p className="page-subtitle">{description}</p>}</div>
    {(action||secondary)&&<div className="head-actions">{secondary}{action}</div>}
  </div>;
}

export function Stat({ label, value, meta, icon, emphasis=false, compact=false }: { label:string; value:ReactNode; meta?:string; icon?:ReactNode; emphasis?:boolean; compact?:boolean }) {
  return <div className={`stat ${emphasis?'stat-emphasis':''} ${compact?'stat-compact':''}`}>
    <div className="stat-label"><span>{label}</span>{icon&&<span className="stat-icon">{icon}</span>}</div>
    <div className="stat-value">{value}</div>{meta&&<div className="stat-meta">{meta}</div>}
  </div>;
}

export function EmptyState({ icon, title, description, action }: { icon?:ReactNode; title:string; description:string; action?:ReactNode }) {
  return <div className="empty-state">{icon&&<div className="empty-icon">{icon}</div>}<h3>{title}</h3><p>{description}</p>{action&&<div className="empty-action">{action}</div>}</div>;
}

export function Progress({ value }: { value:number }) {
  const safe=Math.max(0,Math.min(100,value));
  return <div className="progress" aria-label={`${safe}%`}><span style={{width:`${safe}%`}}/></div>;
}

export function SectionHeader({ title, description, action }: { title:string; description?:string; action?:ReactNode }) {
  return <div className="section-head"><div><h2>{title}</h2>{description&&<p>{description}</p>}</div>{action}</div>;
}

export function Drawer({ open, title, eyebrow, onClose, children, footer }: { open:boolean; title:string; eyebrow?:string; onClose:()=>void; children:ReactNode; footer?:ReactNode }) {
  if(!open) return null;
  return <><button className="drawer-scrim" aria-label="Fechar" onClick={onClose}/><aside className="drawer" role="dialog" aria-modal="true"><div className="drawer-head"><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h2>{title}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Fechar"><X size={17}/></button></div><div className="drawer-body">{children}</div>{footer&&<div className="drawer-footer">{footer}</div>}</aside></>;
}

export function EntityLink({ label='Abrir', href }: { label?:string; href:string }) {
  return <a href={href} className="inline-link">{label}<ArrowUpRight size={13}/></a>;
}

export function SkeletonRows({ count=5 }: { count?:number }) {
  return <div className="skeleton-list">{Array.from({length:count}).map((_,i)=><div className="skeleton-row" key={i}><span/><div><b/><em/></div><i/></div>)}</div>;
}
