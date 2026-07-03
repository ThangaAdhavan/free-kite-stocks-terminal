import type { ReactNode } from 'react';

export default function SectionCard({ title, icon, children, accent = 'var(--bg-card)', right }: { title: string; icon?: ReactNode; children: ReactNode; accent?: string; right?: ReactNode }) {
  return (
    <div className="nb bg-[var(--bg-card)] flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b-[3px] border-[var(--border)]" style={{ background: accent }}>
        {icon}
        <h3 className="font-mono2 font-bold text-sm uppercase tracking-tight">{title}</h3>
        <div className="ml-auto">{right}</div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
