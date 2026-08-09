import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "../src/styles.css";
import "../src/calendar.css";
import "../src/calendar-interactions.css";
import "../src/auth.css";
import "../src/linkedin.css";
import "../src/legal.css";
import "../src/typography-baseline.css";
import "../src/product.css";
import "../src/admin.css";

export const metadata: Metadata = {
  title: "PostingSignal — Social content workspace",
  description: "Plan, approve, schedule, and publish authoritative social content.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
