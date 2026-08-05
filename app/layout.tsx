import type { Metadata } from "next";
import "../src/styles.css";
import "../src/calendar.css";
import "../src/calendar-interactions.css";

export const metadata: Metadata = {
  title: "PostingSignal — Social content workspace",
  description: "Plan, approve, schedule, and publish authoritative social content.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
