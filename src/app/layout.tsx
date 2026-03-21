import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FEEDX Quiz Platform - Secure Online Assessment",
  description: "FEEDX secure, real-time quiz platform with anti-cheat detection for online assessments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Top Navbar with FEEDX logo */}
        <nav className="top-nav">
          <img src="/feedx-logo.jpeg" alt="FEEDX Logo" />
          <span className="brand-name">FEEDX</span>
          <span className="event-name">C Programming Unplugged 2.0</span>
        </nav>
        <div style={{ paddingTop: '60px' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
