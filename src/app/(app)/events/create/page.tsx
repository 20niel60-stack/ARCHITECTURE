import { Card } from "@/components/ui/Card";
import { EventForm } from "@/components/forms/EventForm";

export default function CreateEventPage() {
  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <Card
        title="Create a new event"
        subtitle="Provide the core details and post the event directly."
      >
        <EventForm />
      </Card>
    </div>
  );
}





