import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Akademia Sportive | Menaxhim SaaS",
  description: "Platformë SaaS për menaxhimin e akademive sportive",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sq">
      <body>{children}</body>
    </html>
  );
}