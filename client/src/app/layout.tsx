import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "InterviewPrep",
  description: "Master software engineering interviews",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className={`${inter.className} min-h-full flex flex-col bg-gray-50 text-gray-900`}>
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
