import type { Metadata } from "next";
import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import { AppStateProvider } from "@/components/AppState";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

/** Used only for the landing hero headline. The application itself is all sans. */
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  weight: ["600"],
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
    <html lang="en" className={`${plexSans.variable} ${sourceSerif.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
