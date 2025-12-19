import type { User } from "./auth";
import type { CampusEvent } from "@/types/events";

export function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const startFormatted = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: startDate.getFullYear() !== endDate.getFullYear() ? "numeric" : undefined,
  });
  
  const endFormatted = endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  
  const startTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  
  const endTime = endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  
  if (startFormatted === endFormatted) {
    return `${startFormatted}, ${startTime} - ${endTime}`;
  }
  
  return `${startFormatted} ${startTime} - ${endFormatted} ${endTime}`;
}

/**
 * Filters events based on user's institute
 * Institute system:
 * - FCDSET, FBGM, FNAHS, FALS are separate institutes
 * - ALL means the event is broadcast to all institutes
 * 
 * Rules:
 * - Events posted to a specific institute (e.g., FCDSET) are only visible to students in that institute
 * - Events posted to "ALL" (All Institutes) are visible to all students across all institutes
 * - Admins can see all events regardless of institute
 */
export function filterEventsByInstitute(events: CampusEvent[], user: User | null): CampusEvent[] {
  if (!user) return [];
  
  // Admins can see all events across all institutes
  if (user.role === "admin") {
    return events;
  }
  
  // For students, filter by institute
  return events.filter((event) => {
    const eventInstitute = event.department; // This is the institute the event was posted to
    
    // Events posted to "ALL" (All Institutes) are visible to everyone (all institutes)
    if (eventInstitute === "ALL") {
      return true;
    }
    
    // Events are visible if the event's institute matches the user's institute
    return eventInstitute === user.institute;
  });
}
