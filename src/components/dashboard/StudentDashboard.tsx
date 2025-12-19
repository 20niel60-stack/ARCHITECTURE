"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { EventCard } from "@/components/events/EventCard";
import { Card } from "@/components/ui/Card";
import { getAuthHeaders } from "@/lib/auth";
import { filterEventsByInstitute } from "@/lib/utils";
import type { CampusEvent } from "@/types/events";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export function StudentDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);

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
              // Only show approved events
              return event.status === "approved";
            });
          
          // Filter by institute
          const instituteFiltered = filterEventsByInstitute(transformedEvents, user);
          
          // Filter events happening in the next 7 days (dashboard overview)
          const now = new Date();
          const sevenDaysFromNow = new Date(now);
          sevenDaysFromNow.setDate(now.getDate() + 7);
          
          const upcomingEvents = instituteFiltered
            .filter((event) => {
              if (!event.schedules || event.schedules.length === 0) return false;
              const eventDate = new Date(event.schedules[0].start);
              return eventDate >= now && eventDate <= sevenDaysFromNow;
            })
            // Sort by date (soonest first)
            .sort((a, b) => {
              const dateA = new Date(a.schedules[0].start).getTime();
              const dateB = new Date(b.schedules[0].start).getTime();
              return dateA - dateB;
            })
            .slice(0, 6); // Show up to 6 events for dashboard overview
          
          setEvents(upcomingEvents);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [user]);

  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <Card title="This Week's Events" subtitle="Events happening in the next 7 days">
        {loading ? (
          <p style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
            Loading events...
          </p>
        ) : events.length === 0 ? (
          <p style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
            No upcoming events scheduled.
          </p>
        ) : (
          <div className="grid" style={{ gap: "1rem" }}>
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
