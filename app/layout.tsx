import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Calvet | your page, your rules",
    template: "%s · Calvet"
  },
  description:
    "A personal page for your links, music, interests, and whatever you want to share.",
  icons: {
    icon: "/CalvetLogo.jpg",
    apple: "/CalvetLogo.jpg"
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  )
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
