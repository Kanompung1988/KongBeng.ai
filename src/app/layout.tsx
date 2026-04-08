import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/lib/i18n/context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: {
    default: "Khongbeng Strategist — Premium Stock Analysis",
    template: "%s | Khongbeng Strategist",
  },
  description:
    "Master the market with Khongbeng Strategist — AI-powered stock analysis with the clarity of Sun Tzu and the precision of a quant.",
  keywords: ["stock analysis", "Thai stocks", "SET", "investment", "Khongbeng"],
  authors: [{ name: "Khongbeng" }],
  creator: "Khongbeng",
  icons: {
    icon: "/logo.jpg",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "Khongbeng Strategist — Premium Stock Analysis",
    description: "AI-powered strategic stock analysis. Know what you own.",
    siteName: "Khongbeng Strategist",
  },
  twitter: {
    card: "summary_large_image",
    title: "Khongbeng Strategist",
    description: "AI-powered strategic stock analysis. Know what you own.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={inter.variable}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
          </LanguageProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
