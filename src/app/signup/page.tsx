"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/auth";
import styles from "./signup.module.css";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    institute: "FCDSET",
    phoneNumber: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    // Validate phone number if provided
    if (formData.phoneNumber && !/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError(""); // Clear any previous errors

    try {
      const result = await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.institute,
        formData.phoneNumber || undefined
      );
      
      // Reset form state
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        institute: "FCDSET",
        phoneNumber: "",
      });
      
      // Ensure loading is reset before navigation
      setLoading(false);
      
      // Use setTimeout to ensure state updates are processed before navigation
      setTimeout(() => {
        router.replace(`/login?registered=true&email=${encodeURIComponent(result.email)}`);
      }, 100);
    } catch (err) {
      // Always reset loading state on error
      setLoading(false);
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Create Student Account</h1>
          <p>Sign up as a student to access events</p>
        </div>

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
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                placeholder="John"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                placeholder="Doe"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="you@university.edu"
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="institute">Institute</label>
            <select
              id="institute"
              className={styles.select}
              value={formData.institute}
              onChange={(e) => setFormData({ ...formData, institute: e.target.value })}
              required
            >
              <option value="FCDSET">FCDSET</option>
              <option value="FBGM">FBGM</option>
              <option value="FNAHS">FNAHS</option>
              <option value="FALS">FALS</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="phoneNumber">Phone Number (for SMS notifications)</label>
            <input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+1234567890 or 123-456-7890"
              autoComplete="tel"
            />
            <small style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.25rem", display: "block" }}>
              Optional: Add your phone number to receive SMS notifications for events
            </small>
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
          </div>

          <button 
            type="submit" 
            className={styles.submitButton} 
            disabled={loading}
            style={{ 
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
