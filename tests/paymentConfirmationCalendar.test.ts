import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("payment confirmation calendar handoff", () => {
  const page = readFileSync(resolve(__dirname, "../client/src/pages/PaymentConfirmation.tsx"), "utf8");

  it("offers a direct Google Calendar handoff for confirmed scheduled bookings", () => {
    expect(page).toContain('import { buildBookingCalendarEvent, getGoogleCalendarUrl } from "@/lib/bookingCalendar"');
    expect(page).toContain('booking.status === "confirmed" && calendarEvent');
    expect(page).toContain("Add to Google Calendar");
    expect(page).toContain('href={getGoogleCalendarUrl(calendarEvent)}');
  });

  it("keeps calendar authorization in the member's control", () => {
    expect(page).toContain("Choose Save there to add it");
    expect(page).toContain("never requests access to your calendar");
    expect(page).toContain("<BookingCalendarMenu booking={{");
  });
});
