import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { siteUrl } from "@/utils/seo";

const geist = Geist({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "ReviewHub — Real reviews for real companies",
    template: "%s | ReviewHub",
  },
  description: "Read and write honest reviews for any company.",
  openGraph: {
    siteName: "ReviewHub",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.className} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-100 bg-white py-6 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} ReviewHub
        </footer>
      </body>
    </html>
  );
}
