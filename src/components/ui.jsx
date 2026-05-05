import { ShieldAlert } from "lucide-react";

export function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <div className="panel__head">
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Tag({ children, tone = "neutral" }) {
  return <span className={`tag tag--${tone}`}>{children}</span>;
}

export function Meter({ value, tone = "accent" }) {
  return (
    <div className={`meter meter--${tone}`} aria-label={`${value}%`}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

export function DmOnly({ children }) {
  return (
    <div className="dm-only">
      <ShieldAlert size={16} />
      <span>{children}</span>
    </div>
  );
}

export function EmptyState({ children }) {
  return <p className="empty-state">{children}</p>;
}
