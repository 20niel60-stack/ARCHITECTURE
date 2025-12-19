import Link from "next/link";
import { mockEvents } from "@/data/mockEvents";
import styles from "./upcomingevents.module.css";
import { formatDateRange } from "@/lib/utils";

export function UpcomingEvents() {
  const upcomingEvents = mockEvents.slice(0, 3).filter(
    (event) => event.schedules && event.schedules.length > 0
  );

  if (upcomingEvents.length === 0) {
    return (
      <div className={styles.list}>
        <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem" }}>
          No upcoming events scheduled.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {upcomingEvents.map((event) => {
        const schedule = event.schedules[0];
        return (
          <article key={event.id} className={styles.item}>
            <div>
              <p className={styles.category}>{event.category}</p>
              <h4>{event.title}</h4>
              <p className={styles.meta}>
                {event.location}
                {schedule && ` • ${formatDateRange(schedule.start, schedule.end)}`}
              </p>
            </div>
            <Link href={`/events/${event.id}`} className={styles.cta}>
              View
            </Link>
          </article>
        );
      })}
    </div>
  );
}



