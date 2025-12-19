"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  return <StudentDashboard />;
}



