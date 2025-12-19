"use client";

import { Card } from "@/components/ui/Card";
import { EventForm } from "@/components/forms/EventForm";
import { use } from "react";

interface Props {
  params: Promise<{ id: string }> | { id: string };
}

export default function EditEventPage({ params }: Props) {
  const resolvedParams = typeof params === "object" && "then" in params 
    ? use(params) 
    : params;
  const eventId = resolvedParams.id;

  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <Card
        title="Edit event"
        subtitle="Update the event details below."
      >
        <EventForm eventId={eventId} />
      </Card>
    </div>
  );
}


