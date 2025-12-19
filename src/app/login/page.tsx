"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if user just registered - use window.location to avoid dependency issues
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const registered = urlParams.get("registered");
      const registeredEmail = urlParams.get("email");
      
      if (registered === "true") {
        setSuccess("Account created successfully! Please sign in with your email and password.");
        if (registeredEmail) {
          setEmail(decodeURIComponent(registeredEmail));
        }
        // Clean up URL without scroll
        const url = new URL(window.location.href);
        url.searchParams.delete("registered");
        url.searchParams.delete("email");
        window.history.replaceState({}, "", url.pathname);
      }
    }
  }, []); // Run only once on mount

  // Redirect if authenticated - must be in useEffect, not during render
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Campus Event Hub</h1>
          <p>Sign in to your account</p>
        </div>

        {success && (
          <div style={{ 
            padding: "1rem", 
            marginBottom: "1rem", 
            backgroundColor: "#d4edda", 
            color: "#155724", 
            borderRadius: "0.5rem",
            border: "1px solid #c3e6cb"
          }}>
            {success}
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
            {error.includes("Cannot connect") && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                <strong>Troubleshooting:</strong>
                <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                  <li>Make sure the API Gateway is running on port 4000</li>
                  <li>Make sure the Auth Service is running on port 4001</li>
                  <li>Check that both services are started in their respective directories</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Email or Username</label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin or you@university.edu"
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Don't have an account? <Link href="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

