"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStudent?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireStudent = false,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated, isAdmin, isStudent } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (requireAdmin && !isAdmin) {
      router.push("/dashboard");
      return;
    }

    if (requireStudent && !isStudent) {
      router.push("/dashboard");
      return;
    }
  }, [loading, isAuthenticated, isAdmin, isStudent, requireAdmin, requireStudent, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  if (requireStudent && !isStudent) {
    return null;
  }

  return <>{children}</>;
}



