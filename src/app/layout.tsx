import type { Metadata } from "next";
import { Inter, Source_Serif_4, Lora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif-4",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pencill - AI-Powered Academic Learning Pathways",
  description: "Pencill turns your learning goal into a structured path using relevant free learning resources from across the open web.",
  icons: {
    icon: "/brand/wordmark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif4.variable} ${lora.variable}`}>
      <body className="bg-background text-on-surface antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
