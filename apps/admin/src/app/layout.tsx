import React from "react";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

const sansFont = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const serifFont = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Store Management System — LXUY",
  description: "Administrative catalog panel for inventory tracking and product management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sansFont.variable} ${serifFont.variable} h-full antialiased`}>
      <body className="antialiased min-h-screen bg-[#FDFBF7] text-[#111111]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
