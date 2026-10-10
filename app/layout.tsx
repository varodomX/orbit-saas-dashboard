import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Orbit — Business workspace",
  description:
    "Full stack SaaS portfolio: analytics, projects, and role-based team management.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
