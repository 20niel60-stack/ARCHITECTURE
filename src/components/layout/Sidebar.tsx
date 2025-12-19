"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/data/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./sidebar.module.css";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const userRoles = user ? [user.role] : [];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <p className={styles.brandLabel}>Campus</p>
        <h2 className={styles.brandTitle}>Event Hub</h2>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {navItems
            .filter((item) => {
              if (!item.roles) return true;
              return item.roles.some((role) => userRoles.includes(role));
            })
            .map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href} className={styles.navItem}>
                  <Link
                    href={item.href}
                    className={cn("nav-link", active && "nav-link--active")}
                  >
                    <span aria-hidden>{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge && <span className="tag info">{item.badge}</span>}
                  </Link>
                </li>
              );
            })}
        </ul>
      </nav>
    </aside>
  );
}

