"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getAuthHeaders } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import type { CampusEvent } from "@/types/events";
import styles from "./comments.module.css";

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

interface Props {
  params: Promise<{ id: string }> | { id: string };
}

export default function EventDetailPage({ params }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const resolvedParams = typeof params === "object" && "then" in params 
    ? use(params) 
    : params;
  const eventId = resolvedParams.id;
  
  const [event, setEvent] = useState<CampusEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [eventLikes, setEventLikes] = useState(0);
  const [eventDislikes, setEventDislikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("Event not found");
          } else {
            setError("Failed to load event");
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        const transformedEvent: CampusEvent = {
          id: data.id,
          title: data.data?.title || data.title || "",
          description: data.data?.description || data.description || "",
          department: data.data?.departmentId || "Unknown",
          category: data.data?.category || "General",
          location: data.data?.location || "TBD",
          status: data.status || "draft",
          tags: data.data?.tags || [],
          reserved: data.rsvps?.filter((r: any) => r.status === "going").length || 0,
          organizer: {
            name: "Admin",
            avatar: "",
          },
          schedules: data.data?.schedules || [],
          backgroundImage: data.data?.backgroundImage || undefined,
        };
        setEvent(transformedEvent);
      } catch (err) {
        console.error("Failed to fetch event:", err);
        setError("An error occurred while loading the event");
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  useEffect(() => {
    if (event && user) {
      fetchEventReview();
    }
  }, [event, user]);

  async function fetchEventReview() {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/reviews`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const review: EventReview = await response.json();
        
        // Transform comments to match frontend interface
        const transformedComments: Comment[] = (review.comments || []).map(comment => ({
          id: comment.id,
          eventId: comment.eventId,
          eventTitle: event?.title || "Event",
          studentName: comment.userName,
          comment: comment.comment,
          createdAt: comment.createdAt,
        }));
        
        setComments(transformedComments);
        setEventLikes(review.likes || 0);
        setEventDislikes(review.dislikes || 0);
        
        if (user) {
          setHasLiked(review.likedBy?.includes(user.id) || false);
          setHasDisliked(review.dislikedBy?.includes(user.id) || false);
        }
      } else if (response.status === 404) {
        // No reviews yet, initialize with empty state
        setComments([]);
        setEventLikes(0);
        setEventDislikes(0);
        setHasLiked(false);
        setHasDisliked(false);
      }
    } catch (err) {
      console.error("Failed to load event review:", err);
      // On error, initialize with empty state
      setComments([]);
      setEventLikes(0);
      setEventDislikes(0);
    }
  }


  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    setSubmitting(true);
    try {
      const headers = getAuthHeaders();
      headers["X-User-Name"] = user.name || "Anonymous";
      
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/comments`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          comment: commentText.trim(),
        }),
      });

      if (response.ok) {
        const newComment = await response.json();
        // Transform to match frontend interface
        const transformedComment: Comment = {
          id: newComment.id,
          eventId: newComment.eventId,
          eventTitle: event?.title || "Event",
          studentName: newComment.userName,
          comment: newComment.comment,
          createdAt: newComment.createdAt,
        };
        
        setComments([transformedComment, ...comments]);
        setCommentText("");
        
        // Refresh review to get updated counts
        fetchEventReview();
      } else {
        throw new Error("Failed to submit comment");
      }
    } catch (err) {
      console.error("Failed to submit comment:", err);
      alert("Failed to submit comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeEvent = async () => {
    if (!user) return;
    
    try {
      if (hasLiked) {
        // Unlike
        const response = await fetch(`${API_BASE_URL}/events/${eventId}/likes/${user.id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const review = await response.json();
          setEventLikes(review.likes);
          setEventDislikes(review.dislikes);
          setHasLiked(false);
        }
      } else {
        // Like
        const response = await fetch(`${API_BASE_URL}/events/${eventId}/likes`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            userId: user.id,
          }),
        });

        if (response.ok) {
          const review = await response.json();
          setEventLikes(review.likes);
          setEventDislikes(review.dislikes);
          setHasLiked(true);
          setHasDisliked(false); // Remove dislike if exists
        }
      }
    } catch (err) {
      console.error("Failed to update like:", err);
      alert("Failed to update like. Please try again.");
    }
  };

  const handleDislikeEvent = async () => {
    if (!user) return;
    
    try {
      if (hasDisliked) {
        // Remove dislike
        const response = await fetch(`${API_BASE_URL}/events/${eventId}/dislikes/${user.id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const review = await response.json();
          setEventLikes(review.likes);
          setEventDislikes(review.dislikes);
          setHasDisliked(false);
        }
      } else {
        // Dislike
        const response = await fetch(`${API_BASE_URL}/events/${eventId}/dislikes`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            userId: user.id,
          }),
        });

        if (response.ok) {
          const review = await response.json();
          setEventLikes(review.likes);
          setEventDislikes(review.dislikes);
          setHasDisliked(true);
          setHasLiked(false); // Remove like if exists
        }
      }
    } catch (err) {
      console.error("Failed to update dislike:", err);
      alert("Failed to update dislike. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading event...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--danger)" }}>{error || "Event not found"}</p>
        <button
          onClick={() => router.back()}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <Card 
        title={event.title} 
        subtitle={event.department}
        className={event.backgroundImage ? styles.eventCardWithBackground : undefined}
        style={event.backgroundImage ? {
          backgroundImage: `url(${event.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
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
          <p style={{ marginTop: "0.5rem", color: event.backgroundImage ? "white" : "var(--muted)", lineHeight: "1.6" }}>
            {event.description}
          </p>
        <div
          style={{
            marginTop: "1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <div>
            <p className="tag info" style={{ marginBottom: "0.5rem", color: event.backgroundImage ? "rgba(255, 255, 255, 0.8)" : undefined }}>
              Location
            </p>
            <strong style={{ display: "block", fontSize: "1.1rem", color: event.backgroundImage ? "white" : undefined }}>{event.location}</strong>
          </div>
          <div>
            <p className="tag info" style={{ marginBottom: "0.5rem", color: event.backgroundImage ? "rgba(255, 255, 255, 0.8)" : undefined }}>
              Category
            </p>
            <strong style={{ display: "block", fontSize: "1.1rem", color: event.backgroundImage ? "white" : undefined }}>{event.category}</strong>
          </div>
        </div>
        <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {event.tags.map((tag) => (
            <span key={tag} className="tag" style={{ 
              background: event.backgroundImage ? "rgba(255, 255, 255, 0.2)" : undefined,
              color: event.backgroundImage ? "white" : undefined,
            }}>
              {tag}
            </span>
          ))}
        </div>
        </div>
      </Card>

      <Card title="Event Feedback" subtitle="Share your thoughts about this event">
        {user ? (
          <>
            <div className={styles.eventRating}>
              <p style={{ marginBottom: "0.75rem", fontWeight: 600 }}>Rate this event:</p>
              <div className={styles.ratingButtons}>
                <button
                  onClick={handleLikeEvent}
                  className={`${styles.ratingButton} ${hasLiked ? styles.active : ""}`}
                  title={hasLiked ? "Remove like" : "Like this event"}
                >
                  👍 Like ({eventLikes})
                </button>
                <button
                  onClick={handleDislikeEvent}
                  className={`${styles.ratingButton} ${hasDisliked ? styles.active : ""}`}
                  title={hasDisliked ? "Remove dislike" : "Dislike this event"}
                >
                  👎 Dislike ({eventDislikes})
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmitComment} className={styles.commentForm}>
              <label htmlFor="comment" style={{ marginBottom: "0.5rem", display: "block", fontWeight: 600 }}>
                Leave a comment:
              </label>
              <textarea
                id="comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write your comment or review here..."
                className={styles.commentInput}
                rows={4}
                required
              />
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className={styles.submitButton}
              >
                {submitting ? "Submitting..." : "Post Comment"}
              </button>
            </form>
          </>
        ) : (
          <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
            Please log in to rate and leave a comment.
          </p>
        )}

        <div className={styles.commentsList}>
          {comments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
              <p>No comments yet. Be the first to leave a review!</p>
          </div>
          ) : (
            comments.map((comment) => (
              <article key={comment.id} className={styles.commentCard}>
                <div className={styles.commentHeader}>
          <div>
                    <strong>{comment.studentName}</strong>
                    <span className={styles.commentDate}>{formatDate(comment.createdAt)}</span>
          </div>
          </div>
                <p className={styles.commentText}>{comment.comment}</p>
              </article>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}



