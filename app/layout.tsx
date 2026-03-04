import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Club Members Portal",
  description: "Private social club members bonus checker"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

