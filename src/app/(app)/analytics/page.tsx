"use client";

import { Card } from "@/components/ui/Card";
import { useState, useEffect } from "react";
import styles from "./reviews.module.css";
import { getAuthHeaders } from "@/lib/auth";
import type { CampusEvent } from "@/types/events";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface Comment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
}

interface EventReview {
  eventId: string;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  comments: Comment[];
}

interface EventWithReview extends CampusEvent {
  review?: EventReview;
}

interface WebsiteReview {
  id: string;
  studentName: string;
  comment: string;
  rating: number;
  createdAt: string;
}

export default function EventReviewsPage() {
  const [selectedTab, setSelectedTab] = useState<"events" | "website">("events");
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [eventsWithReviews, setEventsWithReviews] = useState<EventWithReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mockWebsiteReviews: WebsiteReview[] = [];

  const loadReviews = async (): Promise<Map<string, EventReview>> => {
    const reviewsMap = new Map<string, EventReview>();
    
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const reviews: EventReview[] = await response.json();
        reviews.forEach(review => {
          reviewsMap.set(review.eventId, review);
        });
        console.log(`Loaded ${reviews.length} reviews from API`);
      } else {
        console.error("Failed to load reviews from API:", response.status);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    }
    
    return reviewsMap;
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
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
        
        // Load reviews and match with events
        const reviewsMap = await loadReviews();
        
        // Create events with reviews - only include events that exist in the API
        const eventsWithReviewsData: EventWithReview[] = transformedEvents.map(event => {
          const review = reviewsMap.get(event.id);
          return {
            ...event,
            review: review || undefined,
          };
        });
        
        // Sort: events with reviews first, then by title
        eventsWithReviewsData.sort((a, b) => {
          const aHasReview = a.review && ((a.review.likes || 0) + (a.review.dislikes || 0) + (a.review.comments?.length || 0) > 0);
          const bHasReview = b.review && ((b.review.likes || 0) + (b.review.dislikes || 0) + (b.review.comments?.length || 0) > 0);
          
          if (aHasReview && !bHasReview) return -1;
          if (!aHasReview && bHasReview) return 1;
          return a.title.localeCompare(b.title);
        });
        
        setEventsWithReviews(eventsWithReviewsData);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    
    // Refresh when user returns to the tab (catches events that were added/deleted)
    const handleFocus = () => {
      fetchEvents();
    };
    
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
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

  const toggleReview = (eventId: string) => {
    setSelectedReview(selectedReview === eventId ? null : eventId);
  };

  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Event Reviews</h1>
          <p style={{ color: "var(--muted)" }}>
            View student feedback and engagement metrics for events and the platform.
          </p>
        </div>
        <button
          onClick={() => {
            fetchEvents();
          }}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
          title="Refresh data"
          disabled={loading}
        >
          {loading ? "🔄 Refreshing..." : "🔄 Refresh"}
        </button>
      </header>

      <div className={styles.tabs}>
        <button
          className={selectedTab === "events" ? styles.activeTab : styles.tab}
          onClick={() => setSelectedTab("events")}
        >
          Event Reviews
        </button>
        <button
          className={selectedTab === "website" ? styles.activeTab : styles.tab}
          onClick={() => setSelectedTab("website")}
        >
          Website Reviews
        </button>
      </div>

      {selectedTab === "events" && (
        <>
          <Card title="Event Reviews" subtitle="Click on an event to see likes, dislikes, and comments">
            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
                <p>Loading events...</p>
              </div>
            ) : eventsWithReviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
                <p>No events found.</p>
                <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                  Create events in the dashboard to see reviews here.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {eventsWithReviews.map((eventWithReview) => {
                  const review = eventWithReview.review;
                  const isExpanded = selectedReview === eventWithReview.id;
                  const totalEngagement = review ? ((review.likes || 0) + (review.dislikes || 0)) : 0;
                  const hasEngagement = totalEngagement > 0;
                  const hasComments = review && review.comments && review.comments.length > 0;

                return (
                    <div key={eventWithReview.id}>
                      <div
                        onClick={() => toggleReview(eventWithReview.id)}
                        style={{
                          borderRadius: "12px",
                          overflow: "hidden",
                          border: "1px solid var(--border)",
                          background: eventWithReview.backgroundImage ? undefined : "var(--surface)",
                          position: "relative",
                          minHeight: "120px",
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
                        {eventWithReview.backgroundImage && (
                          <>
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundImage: `url(${eventWithReview.backgroundImage})`,
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
                            color: eventWithReview.backgroundImage ? "white" : "var(--text)",
                          }}
                        >
                          <div style={{ marginBottom: "0.5rem" }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "0.85rem",
                                color: eventWithReview.backgroundImage ? "rgba(255, 255, 255, 0.9)" : "var(--muted)",
                                fontWeight: 500,
                              }}
                            >
                              {review && (hasEngagement || hasComments) ? "💬 Event Review Available" : "📅 Event"}
                            </p>
                          </div>
                          <h3
                            style={{
                              margin: "0.25rem 0",
                              fontSize: "1.1rem",
                              fontWeight: 600,
                              color: eventWithReview.backgroundImage ? "white" : "var(--text)",
                              textShadow: eventWithReview.backgroundImage ? "0 1px 2px rgba(0, 0, 0, 0.3)" : undefined,
                            }}
                          >
                            {eventWithReview.title}
                          </h3>
                          <div style={{ 
                            marginTop: "0.5rem", 
                            display: "flex", 
                            gap: "1rem",
                            fontSize: "0.9rem",
                            color: eventWithReview.backgroundImage ? "rgba(255, 255, 255, 0.9)" : "var(--muted)"
                          }}>
                            {review && hasEngagement && (
                              <>
                                <span>👍 {review.likes || 0}</span>
                                <span>👎 {review.dislikes || 0}</span>
                              </>
                            )}
                            {review && hasComments && (
                              <span>💬 {review.comments.length} comment{review.comments.length !== 1 ? 's' : ''}</span>
                            )}
                            {(!review || (!hasEngagement && !hasComments)) && (
                              <span>{review ? "No engagement yet" : "No reviews yet"}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isExpanded && review && (
                        <div style={{ 
                          marginTop: "1rem", 
                          padding: "1.5rem",
                          border: "1px solid var(--border)",
                          borderRadius: "12px",
                          background: "var(--surface-alt)"
                        }}>
                          {/* Combined Likes/Dislikes Graph */}
                          {hasEngagement && (
                            <div style={{ marginBottom: "2rem" }}>
                              <h4 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: 600 }}>
                                Likes & Dislikes
                              </h4>
                              <div className={styles.combinedChart}>
                                <div className={styles.combinedBarContainer}>
                                  <div
                                    className={styles.combinedLikesBar}
                                    style={{
                                      width: `${((review.likes || 0) / totalEngagement) * 100}%`,
                                    }}
                                    title={`Likes: ${review.likes || 0}`}
                      />
                      <div
                                    className={styles.combinedDislikesBar}
                        style={{
                                      width: `${((review.dislikes || 0) / totalEngagement) * 100}%`,
                        }}
                                    title={`Dislikes: ${review.dislikes || 0}`}
                      />
                    </div>
                                <div className={styles.combinedBarStats}>
                                  <span className={styles.likesText}>
                                    👍 {review.likes || 0} ({totalEngagement > 0 ? Math.round(((review.likes || 0) / totalEngagement) * 100) : 0}%)
                                  </span>
                                  <span className={styles.dislikesText}>
                                    👎 {review.dislikes || 0} ({totalEngagement > 0 ? Math.round(((review.dislikes || 0) / totalEngagement) * 100) : 0}%)
                                  </span>
                    </div>
                  </div>
              </div>
            )}

                          {/* Comments Section */}
                          <div>
                            <h4 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: 600 }}>
                              Comments ({review.comments?.length || 0})
                            </h4>
                            {hasComments ? (
                              <div className={styles.reviewsList}>
                                {review.comments.map((comment) => (
                                  <article key={comment.id} className={styles.reviewCard}>
                                    <div className={styles.reviewHeader}>
                                      <div>
                                        <strong>{comment.userName}</strong>
                                      </div>
                                      <span className={styles.date}>{formatDate(comment.createdAt)}</span>
                                    </div>
                                    <p className={styles.comment}>{comment.comment}</p>
                                  </article>
                                ))}
                              </div>
                            ) : (
                              <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
                                <p>No comments yet.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {isExpanded && !review && (
                        <div style={{ 
                          marginTop: "1rem", 
                          padding: "1.5rem",
                          border: "1px solid var(--border)",
                          borderRadius: "12px",
                          background: "var(--surface-alt)",
                          textAlign: "center",
                          color: "var(--muted)"
                        }}>
                          <p>No reviews yet for this event.</p>
                          <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                            Students can like/dislike and comment on this event to see data here.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {selectedTab === "website" && (
        <Card title="Website Reviews" subtitle="Student feedback about the platform">
          {mockWebsiteReviews.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
              <p>No website reviews yet.</p>
            </div>
          ) : (
            <div className={styles.reviewsList}>
              {mockWebsiteReviews.map((review) => (
              <article key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <div>
                    <strong>{review.studentName}</strong>
                    <div className={styles.rating}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < review.rating ? styles.starFilled : styles.starEmpty}>
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={styles.date}>{formatDate(review.createdAt)}</span>
                </div>
                <p className={styles.comment}>{review.comment}</p>
              </article>
            ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
