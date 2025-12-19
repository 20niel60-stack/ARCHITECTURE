"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeaders } from "@/lib/auth";
import styles from "./eventform.module.css";
import type { CampusEvent } from "@/types/events";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface EventFormProps {
  eventId?: string;
  event?: CampusEvent | null;
}

export function EventForm({ eventId, event: initialEvent }: EventFormProps = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [startHour, setStartHour] = useState("12");
  const [startMinute, setStartMinute] = useState("00");
  const [startAmPm, setStartAmPm] = useState<"AM" | "PM">("AM");
  const [endHour, setEndHour] = useState("12");
  const [endMinute, setEndMinute] = useState("00");
  const [endAmPm, setEndAmPm] = useState<"AM" | "PM">("PM");
  const [eventData, setEventData] = useState<CampusEvent | null>(initialEvent || null);
  const isEditMode = !!eventId;

  // Fetch event data if eventId is provided
  useEffect(() => {
    if (eventId && !eventData) {
      async function fetchEvent() {
        try {
          const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            headers: getAuthHeaders(),
          });
          if (response.ok) {
            const data = await response.json();
            const event: CampusEvent = {
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
            };
            setEventData(event);
            
            // Pre-fill form with event data
            if (event.schedules && event.schedules.length > 0) {
              const startDate = new Date(event.schedules[0].start);
              const endDate = new Date(event.schedules[0].end);
              
              // Set start date/time
              const startHours = startDate.getHours();
              const startMins = startDate.getMinutes();
              setStartHour(((startHours % 12) || 12).toString().padStart(2, "0"));
              setStartMinute(startMins.toString().padStart(2, "0"));
              setStartAmPm(startHours >= 12 ? "PM" : "AM");
              
              // Set end date/time
              const endHours = endDate.getHours();
              const endMins = endDate.getMinutes();
              setEndHour(((endHours % 12) || 12).toString().padStart(2, "0"));
              setEndMinute(endMins.toString().padStart(2, "0"));
              setEndAmPm(endHours >= 12 ? "PM" : "AM");
              
              // Set image preview if exists
              if (data.data?.backgroundImage) {
                setImagePreview(data.data.backgroundImage);
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch event:", error);
          setError("Failed to load event data");
        }
      }
      fetchEvent();
    }
  }, [eventId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackgroundImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const department = formData.get("department") as string;
      const category = formData.get("category") as string;
      const location = formData.get("location") as string;
      const startDate = formData.get("startDate") as string;
      const endDate = formData.get("endDate") as string;

      // Validate required fields
      if (!title || title.trim() === "") {
        throw new Error("Event title is required");
      }
      if (!department) {
        throw new Error("Institute is required");
      }
      if (!category) {
        throw new Error("Category is required");
      }
      if (!location || location.trim() === "") {
        throw new Error("Location is required");
      }
      if (!startDate) {
        throw new Error("Start date is required");
      }
      if (!endDate) {
        throw new Error("End date is required");
      }

      // Validate and normalize minutes
      const normalizeMinute = (min: string): string => {
        if (!min || min.trim() === "") {
          return "00";
        }
        const minNum = parseInt(min, 10);
        if (isNaN(minNum) || minNum < 0 || minNum > 59) {
          throw new Error("Minute must be between 0 and 59");
        }
        return minNum.toString().padStart(2, "0");
      };

      const normalizedStartMinute = normalizeMinute(startMinute);
      const normalizedEndMinute = normalizeMinute(endMinute);

      // Convert 12-hour format to 24-hour format
      const convertTo24Hour = (hour: string, minute: string, amPm: "AM" | "PM"): string => {
        let hour24 = parseInt(hour, 10);
        if (isNaN(hour24) || hour24 < 1 || hour24 > 12) {
          throw new Error("Invalid hour value");
        }
        if (amPm === "PM" && hour24 !== 12) {
          hour24 += 12;
        } else if (amPm === "AM" && hour24 === 12) {
          hour24 = 0;
        }
        return `${hour24.toString().padStart(2, "0")}:${minute}`;
      };

      const startTime24 = convertTo24Hour(startHour, normalizedStartMinute, startAmPm);
      const endTime24 = convertTo24Hour(endHour, normalizedEndMinute, endAmPm);

      // Validate dates
      if (!startDate || !endDate) {
        throw new Error("Please select both start and end dates");
      }

      // Combine date and time
      const startDateTimeObj = new Date(`${startDate}T${startTime24}`);
      const endDateTimeObj = new Date(`${endDate}T${endTime24}`);

      // Validate that dates are valid
      if (isNaN(startDateTimeObj.getTime())) {
        throw new Error("Invalid start date/time combination");
      }
      if (isNaN(endDateTimeObj.getTime())) {
        throw new Error("Invalid end date/time combination");
      }

      // Validate that end is after start
      if (endDateTimeObj <= startDateTimeObj) {
        throw new Error("End date/time must be after start date/time");
      }

      const startDateTime = startDateTimeObj.toISOString();
      const endDateTime = endDateTimeObj.toISOString();

      // Upload image if provided
      let imageUrl = "";
      if (backgroundImage) {
        // For now, we'll convert to base64. In production, upload to a file service
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(backgroundImage);
        });
        imageUrl = base64Image;
      }

      // Prepare event data
      const eventData = {
        title,
        description: description || undefined,
        departmentId: department, // In production, map department name to ID
        category,
        location,
        organizerId: user?.id || "",
        schedules: [
          {
            start: startDateTime,
            end: endDateTime,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        ],
        tags: [],
        backgroundImage: imageUrl || undefined,
      };

      if (isEditMode && eventId) {
        // Update existing event
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || "Failed to update event");
        }

        router.push("/dashboard");
        router.refresh();
      } else {
        // Create new event
        const response = await fetch(`${API_BASE_URL}/events`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || "Failed to create event");
        }

        const createdEvent = await response.json();
        
        // Update status to approved (since admin posts directly)
        // This is non-blocking - if it fails, the event is still created
        if (createdEvent.id) {
          try {
            await fetch(`${API_BASE_URL}/events/${createdEvent.id}/status`, {
              method: "PATCH",
              headers: getAuthHeaders(),
              body: JSON.stringify({ status: "approved" }),
            });
          } catch (statusError) {
            // Log but don't fail - event was created successfully
            console.warn("Failed to update event status:", statusError);
          }
        }

        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while creating the event");
      console.error("Event creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className={styles.label}>Event title</label>
        <input
          id="title"
          name="title"
          className={styles.input}
          placeholder="AI & Ethics Symposium"
          required
          minLength={4}
          defaultValue={eventData?.title || ""}
        />
      </div>

      <div className={styles.grid}>
        <div>
          <label htmlFor="department" className={styles.label}>Institute</label>
          <select id="department" name="department" className={styles.select} defaultValue={eventData?.department || "ALL"} required>
            <option value="FCDSET">FCDSET</option>
            <option value="FBGM">FBGM</option>
            <option value="FNAHS">FNAHS</option>
            <option value="FALS">FALS</option>
            <option value="ALL">All Institutes</option>
          </select>
          <small style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
            Select a specific institute or "All Institutes" to broadcast to all institutes
          </small>
        </div>
        <div>
          <label htmlFor="category" className={styles.label}>Category</label>
          <select id="category" name="category" className={styles.select} defaultValue={eventData?.category || "Academic"} required>
            <option value="Academic">Academic</option>
            <option value="Workshop">Workshop</option>
            <option value="Networking">Networking</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="location" className={styles.label}>Location</label>
        <input
          id="location"
          name="location"
          className={styles.input}
          placeholder="Main Auditorium"
          required
          defaultValue={eventData?.location || ""}
        />
      </div>

      <div>
        <label className={styles.label}>Start Date & Time</label>
        <div className={styles.grid}>
          <div>
            <label htmlFor="startDate" className={styles.sublabel}>Date</label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              className={styles.input}
              required
              defaultValue={eventData?.schedules && eventData.schedules.length > 0 
                ? new Date(eventData.schedules[0].start).toISOString().split('T')[0] 
                : ""}
            />
          </div>
          <div>
            <label htmlFor="startHour" className={styles.sublabel}>Hour</label>
            <select
              id="startHour"
              className={styles.select}
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              required
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num.toString().padStart(2, "0")}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="startMinute" className={styles.sublabel}>Minute</label>
            <input
              id="startMinute"
              type="number"
              className={styles.input}
              value={startMinute}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setStartMinute("");
                } else {
                  const numValue = parseInt(value, 10);
                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 59) {
                    setStartMinute(value);
                  }
                }
              }}
              onBlur={(e) => {
                if (e.target.value === "" || parseInt(e.target.value, 10) < 0 || parseInt(e.target.value, 10) > 59) {
                  setStartMinute("00");
                } else {
                  setStartMinute(parseInt(e.target.value, 10).toString().padStart(2, "0"));
                }
              }}
              min="0"
              max="59"
              placeholder="00"
              required
            />
          </div>
          <div>
            <label htmlFor="startAmPm" className={styles.sublabel}>AM/PM</label>
            <select
              id="startAmPm"
              className={styles.select}
              value={startAmPm}
              onChange={(e) => setStartAmPm(e.target.value as "AM" | "PM")}
              required
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className={styles.label}>End Date & Time</label>
        <div className={styles.grid}>
          <div>
            <label htmlFor="endDate" className={styles.sublabel}>Date</label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              className={styles.input}
              required
              defaultValue={eventData?.schedules && eventData.schedules.length > 0 
                ? new Date(eventData.schedules[0].end).toISOString().split('T')[0] 
                : ""}
            />
          </div>
          <div>
            <label htmlFor="endHour" className={styles.sublabel}>Hour</label>
            <select
              id="endHour"
              className={styles.select}
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
              required
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num.toString().padStart(2, "0")}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="endMinute" className={styles.sublabel}>Minute</label>
            <input
              id="endMinute"
              type="number"
              className={styles.input}
              value={endMinute}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setEndMinute("");
                } else {
                  const numValue = parseInt(value, 10);
                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 59) {
                    setEndMinute(value);
                  }
                }
              }}
              onBlur={(e) => {
                if (e.target.value === "" || parseInt(e.target.value, 10) < 0 || parseInt(e.target.value, 10) > 59) {
                  setEndMinute("00");
                } else {
                  setEndMinute(parseInt(e.target.value, 10).toString().padStart(2, "0"));
                }
              }}
              min="0"
              max="59"
              placeholder="00"
              required
            />
          </div>
          <div>
            <label htmlFor="endAmPm" className={styles.sublabel}>AM/PM</label>
            <select
              id="endAmPm"
              className={styles.select}
              value={endAmPm}
              onChange={(e) => setEndAmPm(e.target.value as "AM" | "PM")}
              required
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="description" className={styles.label}>Description</label>
        <textarea
          id="description"
          name="description"
          className={styles.textarea}
          rows={4}
          placeholder="Describe the event, speakers, and outcomes."
          defaultValue={eventData?.description || ""}
        />
      </div>

      <div>
        <label htmlFor="backgroundImage" className={styles.label}>Background Picture</label>
        <input
          id="backgroundImage"
          name="backgroundImage"
          type="file"
          accept="image/*"
          className={styles.fileInput}
          onChange={handleImageChange}
        />
        {imagePreview && (
          <div className={styles.imagePreview}>
            <img src={imagePreview} alt="Preview" />
            <button
              type="button"
              onClick={() => {
                setBackgroundImage(null);
                setImagePreview(null);
                const fileInput = document.getElementById("backgroundImage") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
              }}
              className={styles.removeImage}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className={styles.primary} disabled={loading}>
          {loading ? (isEditMode ? "Updating..." : "Posting...") : (isEditMode ? "Update Event" : "Post Event")}
        </button>
      </div>
    </form>
  );
}
