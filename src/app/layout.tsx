import type { Metadata } from "next";
import { Geist, Orbitron, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"] });
const techMono = Share_Tech_Mono({ variable: "--font-tech-mono", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TicketFlow",
  description: "A small Jira-style ticketing system",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${orbitron.variable} ${techMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
