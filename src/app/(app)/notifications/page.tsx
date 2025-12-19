"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/Card";
import { getAuthHeaders } from "@/lib/auth";
import { filterEventsByInstitute, formatDateRange } from "@/lib/utils";
import type { CampusEvent } from "@/types/events";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "student") {
      setLoading(false);
      return;
    }

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
          
          const now = new Date();
          const twoDaysFromNow = new Date(now);
          twoDaysFromNow.setDate(now.getDate() + 2);
          
          // Show NEW events (approved in last 7 days) OR events starting in next 48 hours
          const notificationEvents = instituteFiltered.filter((event) => {
            if (!event.schedules || event.schedules.length === 0) return false;
            const eventDate = new Date(event.schedules[0].start);
            
            // Events starting in next 48 hours (urgent)
            const isUrgent = eventDate >= now && eventDate <= twoDaysFromNow;
            
            // For now, we'll show all upcoming events but prioritize urgent ones
            // In a real system, you'd track when events were created/approved
            return eventDate >= now;
          })
          // Sort: urgent events first (next 48h), then by date
          .sort((a, b) => {
            const dateA = new Date(a.schedules[0].start).getTime();
            const dateB = new Date(b.schedules[0].start).getTime();
            const nowTime = now.getTime();
            const twoDaysTime = twoDaysFromNow.getTime();
            
            const aIsUrgent = dateA >= nowTime && dateA <= twoDaysTime;
            const bIsUrgent = dateB >= nowTime && dateB <= twoDaysTime;
            
            // Urgent events first
            if (aIsUrgent && !bIsUrgent) return -1;
            if (!aIsUrgent && bIsUrgent) return 1;
            
            // Then sort by date
            return dateA - dateB;
          });
          
          setEvents(notificationEvents);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [user]);

  const formatEventDateTime = (event: CampusEvent) => {
    if (!event.schedules || event.schedules.length === 0) return "";
    const schedule = event.schedules[0];
    return formatDateRange(schedule.start, schedule.end);
  };

  if (user?.role === "student") {
    return (
      <div className="grid" style={{ gap: "1.5rem" }}>
        <Card title="Event Notifications" subtitle="New events and reminders for you">
          {loading ? (
            <p style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
              Loading notifications...
            </p>
          ) : events.length === 0 ? (
            <p style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
              No upcoming events. Check back later!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {events.map((event) => (
                <Link 
                  key={event.id} 
                  href={`/events/${event.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {(() => {
                    const eventDate = new Date(event.schedules?.[0]?.start || new Date());
                    const now = new Date();
                    const hoursUntil = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                    const isUrgent = hoursUntil > 0 && hoursUntil <= 48;
                    const isToday = eventDate.toDateString() === now.toDateString();
                    const borderColor = isUrgent ? "var(--primary)" : "var(--border)";
                    const borderWidth = isUrgent ? "2px" : "1px";
                    
                    return (
                      <div
                        style={{
                          borderRadius: "12px",
                          overflow: "hidden",
                          border: `${borderWidth} solid ${borderColor}`,
                          background: event.backgroundImage ? undefined : "var(--surface)",
                          position: "relative",
                          minHeight: "120px",
                          cursor: "pointer",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          boxShadow: isUrgent ? "0 0 0 2px rgba(37, 99, 235, 0.1)" : "none",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = isUrgent 
                            ? "0 0 0 2px rgba(37, 99, 235, 0.1), var(--shadow-md)" 
                            : "var(--shadow-md)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = isUrgent 
                            ? "0 0 0 2px rgba(37, 99, 235, 0.1)" 
                            : "none";
                        }}
                  >
                    {event.backgroundImage && (
                      <>
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url(${event.backgroundImage})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            zIndex: 0,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "rgba(0, 0, 0, 0.5)",
                            zIndex: 1,
                          }}
                        />
                      </>
                    )}
                    <div
                      style={{
                        position: "relative",
                        zIndex: 2,
                        padding: "1.25rem",
                        color: event.backgroundImage ? "white" : "var(--text)",
                      }}
                    >
                      <div style={{ marginBottom: "0.5rem" }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.85rem",
                            color: event.backgroundImage ? "rgba(255, 255, 255, 0.9)" : (isUrgent ? "var(--primary)" : "var(--muted)"),
                            fontWeight: isUrgent ? 600 : 500,
                          }}
                        >
                          {isToday ? "🔔 Event today!" : isUrgent ? "⏰ Event starting soon" : "📅 New event"}
                        </p>
                      </div>
                      <h3
                        style={{
                          margin: "0.25rem 0",
                          fontSize: "1.1rem",
                          fontWeight: 600,
                          color: event.backgroundImage ? "white" : "var(--text)",
                          textShadow: event.backgroundImage ? "0 1px 2px rgba(0, 0, 0, 0.3)" : undefined,
                        }}
                      >
                        {event.title}
                      </h3>
                      <p
                        style={{
                          margin: "0.5rem 0 0",
                          fontSize: "0.9rem",
                          color: event.backgroundImage ? "rgba(255, 255, 255, 0.95)" : "var(--muted)",
                          lineHeight: 1.5,
                        }}
                      >
                        {formatEventDateTime(event)}
                      </p>
                      {event.location && (
                        <p
                          style={{
                            margin: "0.25rem 0 0",
                            fontSize: "0.85rem",
                            color: event.backgroundImage ? "rgba(255, 255, 255, 0.85)" : "var(--muted)",
                          }}
                        >
                          📍 {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                    );
                  })()}
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Admin view - show preferences and activity notifications
  return <AdminNotificationsView />;
}

function AdminNotificationsView() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch reviews
        const reviewsResponse = await fetch(`${API_BASE_URL}/reviews`, {
          headers: getAuthHeaders(),
        });
        const reviewsData = reviewsResponse.ok ? await reviewsResponse.json() : [];
        
        // Fetch events
        const eventsResponse = await fetch(`${API_BASE_URL}/events`, {
          headers: getAuthHeaders(),
        });
        const eventsData = eventsResponse.ok ? await eventsResponse.json() : [];
        const transformedEvents: CampusEvent[] = eventsData.map((event: any) => ({
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
        
        // Fetch all users to get names
        const usersResponse = await fetch(`${API_BASE_URL}/users`, {
          headers: getAuthHeaders(),
        });
        const usersData = usersResponse.ok ? await usersResponse.json() : [];
        const usersMap: Record<string, any> = {};
        usersData.forEach((u: any) => {
          usersMap[u.id] = u;
        });
        
        setReviews(reviewsData);
        setEvents(transformedEvents);
        setUsers(usersMap);
        
        // Build notifications from reviews (only comments, no likes)
        const notificationList: any[] = [];
        
        reviewsData.forEach((review: any) => {
          const event = transformedEvents.find(e => e.id === review.eventId);
          const eventTitle = event?.title || "Unknown Event";
          
          // Add notifications for comments only (skip if user name is unknown)
          if (review.comments && review.comments.length > 0) {
            review.comments.forEach((comment: any) => {
              const studentName = comment.userName;
              // Skip notifications with unknown or missing user names
              if (!studentName || studentName.trim() === "" || studentName === "Unknown User" || studentName === "Anonymous") {
                return;
              }
              
              notificationList.push({
                id: `comment-${comment.id}`,
                type: "comment",
                studentName: studentName,
                eventTitle: eventTitle,
                eventId: review.eventId,
                commentText: comment.comment,
                timestamp: comment.createdAt,
              });
            });
          }
        });
        
        // Sort by timestamp (newest first)
        notificationList.sort((a, b) => {
          const dateA = new Date(a.timestamp).getTime();
          const dateB = new Date(b.timestamp).getTime();
          return dateB - dateA;
        });
        
        setNotifications(notificationList);
      } catch (error) {
        console.error("Failed to fetch notifications data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <Card 
        title="Student Activity Notifications" 
        subtitle="Recent comments from students"
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
            <p>No activity notifications yet.</p>
            <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
              When students comment on events, they will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={`/events/${notification.eventId}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    padding: "1rem",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    background: "var(--surface)",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div style={{ fontSize: "1.5rem" }}>
                      💬
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <strong style={{ fontSize: "0.95rem" }}>{notification.studentName}</strong>
                        <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                          commented on
                        </span>
                      </div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--primary)", marginBottom: "0.25rem" }}>
                        {notification.eventTitle}
                      </div>
                      {notification.commentText && (
                        <div style={{ 
                          fontSize: "0.85rem", 
                          color: "var(--text)",
                          marginTop: "0.5rem",
                          padding: "0.5rem",
                          background: "var(--surface-alt)",
                          borderRadius: "4px",
                          fontStyle: "italic"
                        }}>
                          "{notification.commentText}"
                        </div>
                      )}
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.5rem" }}>
                        {formatDate(notification.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}





