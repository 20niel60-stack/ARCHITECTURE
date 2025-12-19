"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import styles from "./topbar.module.css";

export function Topbar() {
  const { user, logout } = useAuth();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfilePicture() {
      if (!user?.id || typeof window === "undefined") return;

      try {
        const { getAuthHeaders } = await import("@/lib/auth");
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
        const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.profilePicture) {
            setProfilePicture(userData.profilePicture);
            localStorage.setItem(`profilePicture_${user.id}`, userData.profilePicture);
          } else {
            // Fallback to localStorage
            const savedPicture = localStorage.getItem(`profilePicture_${user.id}`);
            setProfilePicture(savedPicture);
          }
        } else {
          // Fallback to localStorage
          const savedPicture = localStorage.getItem(`profilePicture_${user.id}`);
          setProfilePicture(savedPicture);
        }
      } catch (error) {
        // Only log in development mode, silently handle in production
        if (process.env.NODE_ENV === 'development') {
          console.warn("Profile picture not available, using fallback:", error);
        }
        // Fallback to localStorage
        const savedPicture = localStorage.getItem(`profilePicture_${user.id}`);
        setProfilePicture(savedPicture);
      }
    }

    loadProfilePicture();

    // Listen for profile picture updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `profilePicture_${user?.id}`) {
        setProfilePicture(e.newValue);
      }
    };

    // Listen for custom event (when changed from same tab)
    const handleProfileUpdate = async () => {
      if (user?.id) {
        const savedPicture = localStorage.getItem(`profilePicture_${user.id}`);
        setProfilePicture(savedPicture);
        // Also refresh from API
        try {
          const { getAuthHeaders } = await import("@/lib/auth");
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
          const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
            headers: getAuthHeaders(),
          });
          if (response.ok) {
            const userData = await response.json();
            if (userData.profilePicture) {
              setProfilePicture(userData.profilePicture);
            }
          }
        } catch (error) {
          // Only log in development mode
          if (process.env.NODE_ENV === 'development') {
            console.warn("Failed to refresh profile picture:", error);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("profilePictureUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("profilePictureUpdated", handleProfileUpdate);
    };
  }, [user?.id]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      student: "Student",
      admin: "Admin",
    };
    return labels[role] || role;
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.search}>
        <label htmlFor="global-search" className="sr-only">
          Search events
        </label>
        <input
          id="global-search"
          type="search"
          placeholder="Search events"
        />
      </div>

      <div className={styles.meta}>
        <NotificationBell />
        <div className={styles.user}>
          <div className={styles.userMeta}>
            <strong>{user?.name || "User"}</strong>
            {user?.role === "student" && user.institute && (
              <span className={styles.institute}>{user.institute}</span>
            )}
            <span className={styles.role}>{user ? getRoleLabel(user.role) : "Guest"}</span>
          </div>
          <div 
            className={styles.avatar} 
            aria-hidden
            style={profilePicture ? {
              backgroundImage: `url(${profilePicture})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              color: "transparent",
            } : undefined}
          >
            {!profilePicture && (user ? getInitials(user.name) : "U")}
          </div>
          <button onClick={logout} className={styles.logoutButton} title="Logout">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

