import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Venture | AI Travel Planner",
  description: "Architect your perfect journey with AI.",
};

import { ClerkProvider } from "@clerk/nextjs";
import { TripProvider } from "@/context/TripContext";
import { Instrument_Serif, Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`h-full antialiased ${inter.variable} ${instrumentSerif.variable}`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
          <TripProvider>
            {children}
          </TripProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
