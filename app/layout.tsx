import type { Metadata } from "next";
import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  weight: ["600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Senebiclabs Workforce Platform",
  description: "Clinician task review platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
