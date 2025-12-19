import type { CampusEvent, NotificationPreference } from "@/types/events";

export const mockEvents: CampusEvent[] = [
  {
    id: "evt-1001",
    title: "AI & Ethics Symposium",
    description:
      "Explore responsible AI adoption with faculty, industry experts, and student researchers.",
    department: "College of Engineering",
    category: "Academic",
    location: "Innovation Hall 3F",
    status: "approved",
    tags: ["AI", "Ethics", "Hybrid"],
    capacity: 180,
    reserved: 142,
    organizer: {
      name: "Dr. Naomi Lee",
      avatar: "/avatars/naomi.png",
    },
    schedules: [
      {
        start: "2025-02-14T10:00:00Z",
        end: "2025-02-14T12:30:00Z",
        timezone: "UTC",
      },
    ],
  },
  {
    id: "evt-1002",
    title: "Startup Incubator Demo Day",
    description: "Student founders pitch their MVPs to alumni investors.",
    department: "Business School",
    category: "Entrepreneurship",
    location: "Founders Auditorium",
    status: "pending",
    tags: ["Pitch", "Networking"],
    capacity: 220,
    reserved: 198,
    organizer: {
      name: "Innovation Council",
      avatar: "/avatars/council.png",
    },
    schedules: [
      {
        start: "2025-03-02T18:00:00Z",
        end: "2025-03-02T21:00:00Z",
        timezone: "UTC",
      },
    ],
  },
  {
    id: "evt-1003",
    title: "Campus Sustainability Summit",
    description: "Cross-department workshop to accelerate net-zero initiatives.",
    department: "Environmental Sciences",
    category: "Workshop",
    location: "Green Lab West",
    status: "draft",
    tags: ["Sustainability", "Workshop"],
    capacity: 120,
    reserved: 32,
    organizer: {
      name: "Sustainability Office",
      avatar: "/avatars/sustainability.png",
    },
    schedules: [
      {
        start: "2025-02-28T15:00:00Z",
        end: "2025-02-28T18:00:00Z",
        timezone: "UTC",
      },
    ],
  },
];

export const mockPreferences: NotificationPreference[] = [
  { channel: "email", enabled: true, summary: "Transactional + reminders" },
  { channel: "sms", enabled: false, summary: "Critical alerts only" },
  { channel: "push", enabled: true, summary: "Approvals & RSVPs" },
  { channel: "in_app", enabled: true, summary: "Digest & updates" },
];





