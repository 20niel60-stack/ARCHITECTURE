"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/Card";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function SettingsPage() {
  const { user } = useAuth();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Load profile picture from API on mount
  useEffect(() => {
    async function loadProfilePicture() {
      if (!user?.id) {
        setLoadingProfile(false);
        return;
      }

      try {
        const { getAuthHeaders } = await import("@/lib/auth");
        const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.profilePicture) {
            setProfilePicture(userData.profilePicture);
            setProfilePreview(userData.profilePicture);
            // Also save to localStorage as backup
            localStorage.setItem(`profilePicture_${user.id}`, userData.profilePicture);
          } else {
            // Check localStorage as fallback
            const savedPicture = localStorage.getItem(`profilePicture_${user.id}`);
            if (savedPicture) {
              setProfilePicture(savedPicture);
              setProfilePreview(savedPicture);
            }
          }
        } else {
          // Fallback to localStorage
          const savedPicture = localStorage.getItem(`profilePicture_${user.id}`);
          if (savedPicture) {
            setProfilePicture(savedPicture);
            setProfilePreview(savedPicture);
          }
        }
      } catch (error) {
        // Only log in development mode, silently handle in production
        if (process.env.NODE_ENV === 'development') {
          console.warn("Profile picture not available, using fallback:", error);
        }
        // Fallback to localStorage
        const savedPicture = localStorage.getItem(`profilePicture_${user.id}`);
        if (savedPicture) {
          setProfilePicture(savedPicture);
          setProfilePreview(savedPicture);
        }
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfilePicture();
  }, [user?.id]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Compress and resize image before uploading
  const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id) {
      // Check file size (max 5MB before compression)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image is too large. Please select an image smaller than 5MB.');
        return;
      }

      setUploading(true);
      
      try {
        // Compress the image before converting to base64
        const compressedBase64 = await compressImage(file);
        
        // Check compressed size (base64 is about 33% larger than binary)
        const base64Size = compressedBase64.length;
        if (base64Size > 8 * 1024 * 1024) {
          // If still too large, compress more aggressively
          const moreCompressed = await compressImage(file, 600, 600, 0.7);
          setProfilePreview(moreCompressed);
          
          // Save to API
          const { getAuthHeaders } = await import("@/lib/auth");
          const response = await fetch(`${API_BASE_URL}/users/${user.id}/profile`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ profilePicture: moreCompressed }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 404) {
              throw new Error("User not found. Please log out and log back in.");
            }
            throw new Error(errorData.message || errorData.error || "Failed to update profile picture");
          }

          localStorage.setItem(`profilePicture_${user.id}`, moreCompressed);
          setProfilePicture(moreCompressed);
          window.dispatchEvent(new Event("profilePictureUpdated"));
        } else {
          setProfilePreview(compressedBase64);
          
          // Save to API
          const { getAuthHeaders } = await import("@/lib/auth");
          const response = await fetch(`${API_BASE_URL}/users/${user.id}/profile`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ profilePicture: compressedBase64 }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 404) {
              throw new Error("User not found. Please log out and log back in.");
            }
            throw new Error(errorData.message || errorData.error || "Failed to update profile picture");
          }

          localStorage.setItem(`profilePicture_${user.id}`, compressedBase64);
          setProfilePicture(compressedBase64);
          window.dispatchEvent(new Event("profilePictureUpdated"));
        }
      } catch (error) {
        console.error("Failed to update profile picture:", error);
        alert(error instanceof Error ? error.message : "Failed to update profile picture. Please try again.");
        // Revert preview on error
        setProfilePreview(profilePicture);
      } finally {
        setUploading(false);
      }
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    setChangingPassword(true);
    try {
      const { getAuthHeaders } = await import("@/lib/auth");
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to change password");
      }

      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      setTimeout(() => {
        setPasswordSuccess(false);
      }, 3000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Failed to change password. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  // Use same settings for both admin and student
  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <Card title="Change Profile" subtitle="Update your profile picture and password">
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Profile Picture Section */}
          <div>
            <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem", fontWeight: 600 }}>
              Profile Picture
            </h3>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    ...(profilePreview
                      ? {
                          backgroundImage: `url(${profilePreview})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }
                      : {
                          backgroundColor: "var(--primary)",
                        }),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: profilePreview ? undefined : "white",
                    fontSize: "3rem",
                    fontWeight: 600,
                    border: "4px solid var(--border)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    transition: "transform 0.2s",
                  }}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {!profilePreview && user?.name && getInitials(user.name)}
                {uploading && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "rgba(0, 0, 0, 0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "0.9rem",
                    }}
                  >
                    Uploading...
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: "0.5rem 1.5rem",
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                }}
              >
                {profilePreview ? "Change Picture" : "Upload Picture"}
              </button>
              {profilePreview && (
                <button
                  onClick={async () => {
                    if (user?.id) {
                      try {
                        const { getAuthHeaders } = await import("@/lib/auth");
                        const response = await fetch(`${API_BASE_URL}/users/${user.id}/profile`, {
                          method: "PATCH",
                          headers: getAuthHeaders(),
                          body: JSON.stringify({ profilePicture: null }),
                        });

                        if (!response.ok) {
                          throw new Error("Failed to remove profile picture");
                        }

                        localStorage.removeItem(`profilePicture_${user.id}`);
                        setProfilePicture(null);
                        setProfilePreview(null);
                        // Dispatch event to update topbar
                        window.dispatchEvent(new Event("profilePictureUpdated"));
                      } catch (error) {
                        console.error("Failed to remove profile picture:", error);
                        alert("Failed to remove profile picture. Please try again.");
                      }
                    }
                  }}
                  style={{
                    padding: "0.4rem 1rem",
                    background: "transparent",
                    color: "var(--danger, #ef4444)",
                    border: "1px solid var(--danger, #ef4444)",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Remove Picture
                </button>
              )}
            </div>
          </div>

          {/* Change Password Section */}
          <div>
            <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem", fontWeight: 600 }}>
              Change Password
            </h3>
            <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label
                  htmlFor="currentPassword"
                  style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}
                >
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    fontSize: "0.95rem",
                    background: "var(--surface-alt)",
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="newPassword"
                  style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  required
                  minLength={6}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    fontSize: "0.95rem",
                    background: "var(--surface-alt)",
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  required
                  minLength={6}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    fontSize: "0.95rem",
                    background: "var(--surface-alt)",
                  }}
                />
              </div>
              {passwordError && (
                <div
                  style={{
                    padding: "0.75rem",
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "var(--danger, #ef4444)",
                    borderRadius: "0.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div
                  style={{
                    padding: "0.75rem",
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "var(--success, #10b981)",
                    borderRadius: "0.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  Password changed successfully!
                </div>
              )}
              <button
                type="submit"
                disabled={changingPassword}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: changingPassword ? "var(--muted)" : "var(--primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: changingPassword ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  alignSelf: "flex-start",
                }}
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
}





