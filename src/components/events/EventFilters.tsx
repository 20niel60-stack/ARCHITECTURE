"use client";

import { useState } from "react";
import styles from "./eventfilters.module.css";

type FilterType = "all" | "thisWeek" | "nextWeek" | "nextMonth";

interface EventFiltersProps {
  onFilterChange?: (filter: FilterType) => void;
}

const filters: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "This Week", value: "thisWeek" },
  { label: "Next Week", value: "nextWeek" },
  { label: "Next Month", value: "nextMonth" },
];

export function EventFilters({ onFilterChange }: EventFiltersProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
    onFilterChange?.(filter);
  };

  return (
    <div className={styles.filters}>
      {filters.map((filter) => (
        <button
          key={filter.value}
          className={activeFilter === filter.value ? styles.active : undefined}
          type="button"
          onClick={() => handleFilterClick(filter.value)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
