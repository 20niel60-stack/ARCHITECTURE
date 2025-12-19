"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeaders } from "@/lib/auth";
import { formatDateRange, filterEventsByInstitute } from "@/lib/utils";
import type { CampusEvent } from "@/types/events";
import styles from "./calendar.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function CalendarPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch(`${API_BASE_URL}/events`, {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          // Transform API response to match CampusEvent type
          const transformedEvents: CampusEvent[] = data
            .map((event: any) => ({
              id: event.id,
              title: event.data?.title || event.title || "",
              description: event.data?.description || event.description || "",
              department: event.data?.departmentId || "Unknown",
              category: event.data?.category || "General",
              location: event.data?.location || "TBD",
              status: event.status || "draft",
              tags: event.data?.tags || [],
              capacity: event.data?.capacity || 0,
              reserved: event.rsvps?.filter((r: any) => r.status === "going").length || 0,
              organizer: {
                name: "Admin",
                avatar: "",
              },
              schedules: event.data?.schedules || [],
              backgroundImage: event.data?.backgroundImage || undefined,
            }))
            .filter((event: CampusEvent) => {
              // For students, only show approved events
              if (user?.role === "student" && event.status !== "approved") {
                return false;
              }
              return true;
            });
          
          // Filter by institute
          const instituteFiltered = filterEventsByInstitute(transformedEvents, user);
          setEvents(instituteFiltered);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [user?.role]);

  // Group events by date
  const eventsByDate = new Map<string, CampusEvent[]>();
  events.forEach((event) => {
    if (!event.schedules || event.schedules.length === 0) return;
    const eventDate = new Date(event.schedules[0].start);
    const dateKey = eventDate.toISOString().split("T")[0]; // YYYY-MM-DD
    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, []);
    }
    eventsByDate.get(dateKey)!.push(event);
  });

  // Generate calendar days
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDateKey = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date.toISOString().split("T")[0];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatTimeRange = (start: string, end: string) => {
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const today = new Date();

  return (
    <div>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: "0.5rem 0" }}>Event Calendar</h1>
        <p style={{ color: "var(--muted)" }}>
          View events by date on the calendar below. Click on a date to see events for that day.
        </p>
      </header>

      <div className={styles.calendarContainer}>
        <div className={styles.calendar}>
          <div className={styles.calendarHeader}>
            <button
              type="button"
              onClick={() => navigateMonth("prev")}
              className={styles.navButton}
              aria-label="Previous month"
            >
              ←
            </button>
            <h2>
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button
              type="button"
              onClick={() => navigateMonth("next")}
              className={styles.navButton}
              aria-label="Next month"
            >
              →
            </button>
          </div>

          <div className={styles.calendarGrid}>
            {dayNames.map((day) => (
              <div key={day} className={styles.dayHeader}>
                {day}
              </div>
            ))}

            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className={styles.emptyDay} />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dateKey = getDateKey(day);
              const dayEvents = eventsByDate.get(dateKey) || [];
              const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();
              const isSelected = selectedDate
                ? day === selectedDate.getDate() &&
                  currentMonth === selectedDate.getMonth() &&
                  currentYear === selectedDate.getFullYear()
                : false;

              return (
                <div
                  key={day}
                  className={`${styles.calendarDay} ${isToday ? styles.today : ""} ${
                    isSelected ? styles.selected : ""
                  } ${dayEvents.length > 0 ? styles.hasEvents : ""}`}
                  onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                >
                  <span className={styles.dayNumber}>{day}</span>
                  {dayEvents.length > 0 && (
                    <span className={styles.eventIndicator}>
                      {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div className={styles.eventsPanel}>
            <h3>
              Events on {selectedDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h3>
            {loading ? (
              <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem" }}>
                Loading events...
              </p>
            ) : (() => {
              const dateKey = selectedDate.toISOString().split("T")[0];
              const dayEvents = eventsByDate.get(dateKey) || [];
              return dayEvents.length === 0 ? (
                <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem" }}>
                  No events on this date.
                </p>
              ) : (
                <div className={styles.eventsList}>
                  {dayEvents.map((event) => (
                    <div key={event.id} className={styles.eventItem}>
                      <div className={styles.eventTime}>
                        {event.schedules && event.schedules.length > 0 ? (
                          <div>
                            <div className={styles.timeLabel}>Start:</div>
                            <div className={styles.timeValue}>
                              {formatTime(event.schedules[0].start)}
                            </div>
                            <div className={styles.timeLabel}>End:</div>
                            <div className={styles.timeValue}>
                              {formatTime(event.schedules[0].end)}
                            </div>
                          </div>
                        ) : (
                          "TBD"
                        )}
                      </div>
                      <div className={styles.eventDetails}>
                        <h4>{event.title}</h4>
                        <p className={styles.eventLocation}>{event.location}</p>
                        {event.schedules && event.schedules.length > 0 && (
                          <p className={styles.eventTimeRange}>
                            {formatTimeRange(event.schedules[0].start, event.schedules[0].end)}
                          </p>
                        )}
                        {event.description && (
                          <p className={styles.eventDescription}>{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
