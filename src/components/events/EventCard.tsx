"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { CampusEvent } from "@/types/events";
import styles from "./eventcard.module.css";
import { formatDateRange } from "@/lib/utils";
import { getAuthHeaders } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface EventCardProps {
  event: CampusEvent;
  onDelete?: (eventId: string) => void;
}

const statusMap: Record<
  CampusEvent["status"],
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: styles.draft },
  pending: { label: "Pending Approval", className: styles.pending },
  approved: { label: "Approved", className: styles.approved },
  rejected: { label: "Rejected", className: styles.rejected },
  canceled: { label: "Canceled", className: styles.canceled },
  completed: { label: "Completed", className: styles.completed },
};

export function EventCard({ event, onDelete }: EventCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const status = statusMap[event.status] || statusMap.draft;
  const isAdmin = user?.role === "admin";

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${event.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // For DELETE requests, we only need Authorization header, not Content-Type
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/events/${event.id}`, {
        method: "DELETE",
        headers,
      });

      if (response.ok || response.status === 204) {
        if (onDelete) {
          onDelete(event.id);
        } else {
          router.refresh();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || errorData.error || "Failed to delete event");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting the event");
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/events/${event.id}/edit`);
  };

  return (
    <article 
      className={styles.card}
      style={event.backgroundImage ? {
        backgroundImage: `url(${event.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        overflow: 'hidden',
      } : undefined}
    >
      {event.backgroundImage && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '18px',
          zIndex: 0,
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <header>
          <div>
            <p style={{ color: event.backgroundImage ? 'rgba(255, 255, 255, 0.9)' : undefined }}>{event.department}</p>
            <h3 style={{ color: event.backgroundImage ? 'white' : undefined, textShadow: event.backgroundImage ? '0 2px 4px rgba(0, 0, 0, 0.3)' : undefined }}>{event.title}</h3>
          </div>
          <span className={status.className}>{status.label}</span>
        </header>

        <p className={styles.description} style={{ color: event.backgroundImage ? 'rgba(255, 255, 255, 0.95)' : undefined }}>
          {event.description}
        </p>

        <dl className={styles.meta}>
          {event.schedules && event.schedules.length > 0 && (
            <div>
              <dt style={{ color: event.backgroundImage ? 'rgba(255, 255, 255, 0.8)' : undefined }}>Schedule</dt>
              <dd style={{ color: event.backgroundImage ? 'white' : undefined }}>{formatDateRange(event.schedules[0].start, event.schedules[0].end)}</dd>
            </div>
          )}
          <div>
            <dt style={{ color: event.backgroundImage ? 'rgba(255, 255, 255, 0.8)' : undefined }}>Location</dt>
            <dd style={{ color: event.backgroundImage ? 'white' : undefined }}>{event.location || "TBD"}</dd>
          </div>
        </dl>

        <footer>
          <div className={styles.tags}>
            {event.tags.map((tag) => (
              <span 
                key={tag} 
                className="tag"
                style={{
                  background: event.backgroundImage ? 'rgba(255, 255, 255, 0.2)' : undefined,
                  color: event.backgroundImage ? 'white' : undefined,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {isAdmin && (
              <>
                <button
                  onClick={handleEdit}
                  className={styles.editButton}
                  title="Edit event"
                  style={{
                    padding: "0.5rem 1rem",
                    background: event.backgroundImage ? "rgba(255, 255, 255, 0.2)" : "var(--accent)",
                    color: event.backgroundImage ? "white" : "var(--accent-foreground)",
                    border: event.backgroundImage ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className={styles.deleteButton}
                  title="Delete event"
                  style={{
                    padding: "0.5rem 1rem",
                    background: "var(--destructive, #ef4444)",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  Delete
                </button>
              </>
            )}
            <Link 
              href={`/events/${event.id}`} 
              className={styles.link}
              style={{ 
                color: event.backgroundImage ? 'white' : undefined,
                textShadow: event.backgroundImage ? '0 1px 2px rgba(0, 0, 0, 0.3)' : undefined,
              }}
            >
              View details →
            </Link>
          </div>
        </footer>
      </div>
    </article>
  );
}



