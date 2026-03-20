import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FEEDEX Quiz Platform - Secure Online Assessment",
  description: "FEEDEX secure, real-time quiz platform with anti-cheat detection for online assessments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Top Navbar with FEEDEX logo */}
        <nav className="top-nav">
          <img src="/feedex-logo.jpeg" alt="FEEDEX Logo" />
          <span className="brand-name">FEEDEX</span>
          <span className="event-name">C Programming Unplugged 2.0</span>
        </nav>
        <div style={{ paddingTop: '60px' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
