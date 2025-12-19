export type EventStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "canceled"
  | "completed";

export interface EventSchedule {
  start: string;
  end: string;
  timezone: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  department: string;
  category: string;
  location: string;
  status: EventStatus;
  tags: string[];
  capacity: number;
  reserved: number;
  schedules: EventSchedule[];
  organizer: {
    name: string;
    avatar: string;
  };
  backgroundImage?: string;
}

export interface NotificationPreference {
  channel: "email" | "sms" | "push" | "in_app";
  enabled: boolean;
  summary: string;
}





