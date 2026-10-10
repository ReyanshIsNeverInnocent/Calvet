import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Calvet — make the internet feel like yours",
    template: "%s · Calvet"
  },
  description:
    "One page for your links, socials, projects, and whatever you want people to find. Built to be yours.",
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
