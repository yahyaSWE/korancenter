import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Korancenter – Lär dig Koranen",
  description:
    "Korancenter är ett online-institut där kvinnor lär sig läsa och memorera Koranen med professionella, kvinnliga lärare.",
  keywords: ["Koranen", "islamisk utbildning", "koranläsning", "memorering", "online kurs"],
  openGraph: {
    title: "Korancenter – Lär dig Koranen",
    description: "Professionell koranundervisning för kvinnor online.",
    locale: "sv_SE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
