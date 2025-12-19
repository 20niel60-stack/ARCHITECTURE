"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import styles from "./appshell.module.css";

interface Props {
  children: React.ReactNode;
}

export function AppShell({ children }: Props) {
  return (
    <div className={`app-shell ${styles.shell}`}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

