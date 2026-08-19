import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exercise Catalog API",
  description: "API for exercise catalog management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
