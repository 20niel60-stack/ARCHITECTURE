import type { NavItem } from "@/types/navigation";

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Calendar", href: "/calendar", icon: "📆" },
  { label: "Create Event", href: "/events/create", icon: "✨", roles: ["admin"] },
  { label: "Notifications", href: "/notifications", icon: "🔔" },
  { label: "Event Reviews", href: "/analytics", icon: "💬", roles: ["admin"] },
  { label: "Settings", href: "/settings", icon: "⚙️" },
];



