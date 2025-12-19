import styles from "./snapshotgrid.module.css";

const snapshots = [
  { label: "RSVP conversion", value: "82%", detail: "+6 pts vs last month" },
  { label: "Notification delivery", value: "99.1%", detail: "SES + Push" },
  { label: "Conflicts resolved", value: "12", detail: "Avg 2h SLA" },
  { label: "Feedback response rate", value: "47%", detail: "+12% WoW" },
];

export function SnapshotGrid() {
  return (
    <div className={styles.grid}>
      {snapshots.map((item) => (
        <article key={item.label} className={styles.item}>
          <p>{item.label}</p>
          <strong>{item.value}</strong>
          <span>{item.detail}</span>
        </article>
      ))}
    </div>
  );
}



