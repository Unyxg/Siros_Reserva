import { CalendarPlus, Download } from "lucide-react";
import { googleCalendarUrl } from "@/lib/calendar";

type R = { id: string; date: string; startTime: string; endTime: string; reason: string };

export default function AddToCalendar({ r }: { r: R }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a href={googleCalendarUrl(r)} target="_blank" rel="noopener noreferrer" className="btn-secondary min-h-11 px-4 py-2 text-base">
        <CalendarPlus className="h-5 w-5 text-brand-600" aria-hidden /> Google Calendar
      </a>
      <a href={`/api/reservas/${r.id}/calendario`} className="btn-secondary min-h-11 px-4 py-2 text-base">
        <Download className="h-5 w-5 text-brand-600" aria-hidden /> iPhone / Outlook
      </a>
    </div>
  );
}
