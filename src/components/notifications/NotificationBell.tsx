"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeaders } from "@/lib/auth";
import { filterEventsByInstitute } from "@/lib/utils";
import type { CampusEvent } from "@/types/events";
import Link from "next/link";
import styles from "./notificationbell.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface Notification {
  id: string;
  type: "event" | "comment";
  title: string;
  message: string;
  eventId?: string;
  timestamp: string;
  read?: boolean;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchNotifications() {
      try {
        setLoading(true);
        
        if (user.role === "student") {
          // Fetch upcoming events for students
          const response = await fetch(`${API_BASE_URL}/events`, {
            headers: getAuthHeaders(),
          });
          
          if (response.ok) {
            const data = await response.json();
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
              .filter((event: CampusEvent) => event.status === "approved");
            
            const instituteFiltered = filterEventsByInstitute(transformedEvents, user);
            const now = new Date();
            const twoDaysFromNow = new Date(now);
            twoDaysFromNow.setDate(now.getDate() + 2);
            
            // Show only URGENT notifications: events starting in next 48 hours
            const urgentEvents = instituteFiltered
              .filter((event) => {
                if (!event.schedules || event.schedules.length === 0) return false;
                const eventDate = new Date(event.schedules[0].start);
                return eventDate >= now && eventDate <= twoDaysFromNow;
              })
              .sort((a, b) => {
                const dateA = new Date(a.schedules[0].start).getTime();
                const dateB = new Date(b.schedules[0].start).getTime();
                return dateA - dateB;
              })
              .slice(0, 5); // Limit to 5 most urgent
            
            const eventNotifications: Notification[] = urgentEvents.map((event) => {
              const eventDate = new Date(event.schedules[0].start);
              const hoursUntil = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
              const isToday = eventDate.toDateString() === now.toDateString();
              
              let message = `Starts ${isToday ? 'today' : 'soon'}`;
              if (hoursUntil < 24) {
                message = `Starts in ${Math.round(hoursUntil)} hours`;
              }
              
              return {
                id: `event-${event.id}`,
                type: "event",
                title: event.title,
                message: message,
                eventId: event.id,
                timestamp: event.schedules[0].start,
                read: false,
              };
            });
            
            setNotifications(eventNotifications);
            setUnreadCount(eventNotifications.length);
          }
        } else {
          // Fetch comments for admins
          const reviewsResponse = await fetch(`${API_BASE_URL}/reviews`, {
            headers: getAuthHeaders(),
          });
          const eventsResponse = await fetch(`${API_BASE_URL}/events`, {
            headers: getAuthHeaders(),
          });
          
          if (reviewsResponse.ok && eventsResponse.ok) {
            const reviewsData = await reviewsResponse.json();
            const eventsData = await eventsResponse.json();
            
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
            
            const commentNotifications: Notification[] = [];
            
            reviewsData.forEach((review: any) => {
              const event = transformedEvents.find(e => e.id === review.eventId);
              const eventTitle = event?.title || "Unknown Event";
              
              if (review.comments && review.comments.length > 0) {
                review.comments.forEach((comment: any) => {
                  const studentName = comment.userName;
                  if (studentName && studentName.trim() !== "" && studentName !== "Unknown User" && studentName !== "Anonymous") {
                    commentNotifications.push({
                      id: `comment-${comment.id}`,
                      type: "comment",
                      title: `${studentName} commented`,
                      message: `on ${eventTitle}`,
                      eventId: review.eventId,
                      timestamp: comment.createdAt,
                      read: false,
                    });
                  }
                });
              }
            });
            
            // Sort by timestamp (newest first) and limit to 5
            commentNotifications.sort((a, b) => {
              const dateA = new Date(a.timestamp).getTime();
              const dateB = new Date(b.timestamp).getTime();
              return dateB - dateA;
            });
            
            const recentNotifications = commentNotifications.slice(0, 5);
            setNotifications(recentNotifications);
            setUnreadCount(recentNotifications.length);
          }
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        title="Notifications"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3>Notifications</h3>
            <Link href="/notifications" className={styles.viewAll}>
              View all
            </Link>
          </div>
          
          <div className={styles.notificationsList}>
            {loading ? (
              <div className={styles.empty}>Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className={styles.empty}>No notifications</div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.eventId ? `/events/${notification.eventId}` : "/notifications"}
                  className={styles.notificationItem}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={styles.notificationIcon}>
                    {notification.type === "event" ? "📅" : "💬"}
                  </div>
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationTitle}>{notification.title}</div>
                    <div className={styles.notificationMessage}>{notification.message}</div>
                    <div className={styles.notificationTime}>
                      {formatTime(notification.timestamp)}
                    </div>
                  </div>
                  {!notification.read && <div className={styles.unreadDot} />}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

