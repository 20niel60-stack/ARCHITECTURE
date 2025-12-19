import styles from "./statcard.module.css";

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
}

export function StatCard({ label, value, delta, trend = "up" }: StatCardProps) {
  return (
    <div className={styles.card}>
      <p>{label}</p>
      <strong>{value}</strong>
      {delta && (
        <span className={trend === "up" ? styles.up : styles.down}>
          {trend === "up" ? "↑" : "↓"} {delta}
        </span>
      )}
    </div>
  );
}





