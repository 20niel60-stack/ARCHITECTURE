"use client";

import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/dashboard/StatCard";
import { EventFilters } from "@/components/events/EventFilters";
import { EventCard } from "@/components/events/EventCard";
import { useState, useEffect, useMemo } from "react";
import { getAuthHeaders } from "@/lib/auth";
import { filterEventsByInstitute } from "@/lib/utils";
import type { CampusEvent } from "@/types/events";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type FilterType = "all" | "thisWeek" | "nextWeek" | "nextMonth";

export function AdminDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch(`${API_BASE_URL}/events`, {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          // Transform API response to match CampusEvent type
          const transformedEvents: CampusEvent[] = data.map((event: any) => ({
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
          }));
          setEvents(transformedEvents);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const handleDelete = (eventId: string) => {
    setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId));
  };

  const filteredEvents = useMemo(() => {
    // First filter by institute (for students)
    let instituteFiltered = filterEventsByInstitute(events, user);
    
    // Then apply time-based filter
    if (selectedFilter === "all") return instituteFiltered;

    const now = new Date();
    
    // Calculate this week (Sunday to Saturday)
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 7);

    // Calculate next week
    const nextWeekStart = new Date(thisWeekEnd);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 7);

    // Calculate next month (first day of next month to first day of month after)
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    nextMonthStart.setHours(0, 0, 0, 0);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    nextMonthEnd.setHours(0, 0, 0, 0);

    return instituteFiltered.filter((event) => {
      if (!event.schedules || event.schedules.length === 0) return false;
      const eventDate = new Date(event.schedules[0].start);
      eventDate.setHours(0, 0, 0, 0);

      switch (selectedFilter) {
        case "thisWeek":
          return eventDate >= thisWeekStart && eventDate < thisWeekEnd;
        case "nextWeek":
          return eventDate >= nextWeekStart && eventDate < nextWeekEnd;
        case "nextMonth":
          return eventDate >= nextMonthStart && eventDate < nextMonthEnd;
        default:
          return true;
      }
    });
  }, [events, selectedFilter, user]);

  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <section className="grid grid-cols-3">
        <StatCard label="Upcoming events" value={filteredEvents.length.toString()} delta="Filtered events" />
        <StatCard label="Total events" value={events.length.toString()} delta="All events" />
        <StatCard label="Notification success" value="99.1%" delta="+0.4%" />
      </section>

      <div>
        <header style={{ marginBottom: "1rem" }}>
          <p className="tag info">Live catalog</p>
          <h1 style={{ margin: "0.5rem 0" }}>Events directory</h1>
          <p style={{ color: "var(--muted)" }}>
            Browse and coordinate academic, extracurricular, and administrative programming.
          </p>
        </header>
        <EventFilters onFilterChange={setSelectedFilter} />
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
            <p>Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
            <p>No events found.</p>
          </div>
        ) : (
          <div className="grid" style={{ gap: "1.25rem", marginTop: "1.5rem" }}>
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
