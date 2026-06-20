import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EstateFlow CRM — Real Estate Management",
  description:
    "Professional Real Estate CRM for managing leads, contacts, deals, and properties.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">{children}</body>
    </html>
  );
}
