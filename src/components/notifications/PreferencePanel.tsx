import { mockPreferences } from "@/data/mockEvents";
import styles from "./preferencepanel.module.css";

export function PreferencePanel() {
  return (
    <div className={styles.panel}>
      {mockPreferences.map((preference) => (
        <label key={preference.channel} className={styles.preference}>
          <div>
            <strong>{preference.channel.toUpperCase()}</strong>
            <p>{preference.summary}</p>
          </div>
          <input type="checkbox" defaultChecked={preference.enabled} />
        </label>
      ))}
    </div>
  );
}





