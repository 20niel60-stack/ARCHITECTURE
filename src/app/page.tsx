"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className={styles.hero}>
        <div className={styles.content}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.hero}>
      <div className={styles.content}>
        <p className="tag info">Campus-wide rollout Q2 2025</p>
        <h1>
          Campus Event Management &amp; Notification
          <br />
          built for modern universities.
        </h1>
        <p>
          Unify departmental calendars, automate approvals, and deliver multi-channel notifications
          in seconds. A production-ready reference implementation aligned with the official campus
          proposal.
        </p>
        <div className={styles.actions}>
          <Link href="/login">Sign in</Link>
          <Link href="/signup" className={styles.secondary}>
            Create account
          </Link>
        </div>
        <ul className={styles.highlights}>
          <li>✔ Microservice ready</li>
          <li>✔ Approval + conflict engine</li>
          <li>✔ Analytics & notifications</li>
        </ul>
      </div>
      <div className={styles.sidebar}>
        <h3>Live system blueprint</h3>
        <ul>
          <li>
            <strong>Microservices</strong>
            <span>Auth, Event, Notification, Analytics, Search, Feedback</span>
          </li>
          <li>
            <strong>Deployment</strong>
            <span>Kubernetes ready, CI/CD pipeline spec</span>
          </li>
          <li>
            <strong>Security</strong>
            <span>JWT, RBAC, MFA, rate limiting, audit logging</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
