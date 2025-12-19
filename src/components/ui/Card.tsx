import { cn } from "@/lib/utils";
import styles from "./card.module.css";

interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ title, subtitle, actions, className, children, style }: CardProps) {
  const hasBackground = style?.backgroundImage !== undefined;
  
  return (
    <section className={cn(styles.card, className)} style={style}>
      {(title || actions) && (
        <header className={styles.header} style={hasBackground ? { position: 'relative', zIndex: 2 } : undefined}>
          <div style={hasBackground ? {
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '1rem',
            borderRadius: '8px',
            backdropFilter: 'blur(4px)',
          } : undefined}>
            {title && (
              <h3 style={hasBackground ? { 
                color: 'white', 
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.5)',
                fontWeight: 700,
                marginBottom: subtitle ? '0.25rem' : 0,
              } : undefined}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={hasBackground ? { 
                color: 'rgba(255, 255, 255, 0.95)', 
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.5)',
                fontWeight: 500,
                margin: 0,
              } : undefined}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}





