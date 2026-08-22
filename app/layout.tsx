import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { AppStateProvider } from "@/components/AppState";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Senebiclabs",
  description: "Clinical review platform for licensed clinicians",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plexSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
