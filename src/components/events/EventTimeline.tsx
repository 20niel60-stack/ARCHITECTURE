import type { CampusEvent } from "@/types/events";
import styles from "./eventtimeline.module.css";
import { formatDateRange } from "@/lib/utils";

interface Props {
  event: CampusEvent;
}

export function EventTimeline({ event }: Props) {
  const schedule = event.schedules && event.schedules.length > 0 ? event.schedules[0] : null;
  const milestones = [
    { label: "Drafted", date: "2025-01-12 09:00" },
    { label: "Submitted for approval", date: "2025-01-18 14:20" },
    { label: "Conflict resolved", date: "2025-01-19 16:45" },
    { label: "Approved", date: "2025-01-20 10:10" },
  ];

  return (
    <div className={styles.timeline}>
      {schedule && (
        <div className={styles.schedule}>
          <h4>Primary schedule</h4>
          <p>{formatDateRange(schedule.start, schedule.end)}</p>
          <p className={styles.timezone}>Timezone: {schedule.timezone || "UTC"}</p>
        </div>
      )}

      {milestones.length > 0 && (
        <ul className={styles.milestones}>
          {milestones.map((item) => (
            <li key={item.label} className={styles.milestone}>
              <div className={styles.dot} aria-hidden />
              <div>
                <strong>{item.label}</strong>
                <p>{item.date}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}



