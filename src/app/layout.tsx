import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: {
    default: "KongBeng Strategist — Premium Stock Analysis",
    template: "%s | KongBeng Strategist",
  },
  description:
    "Master the market with KongBeng Strategist — AI-powered stock analysis with the clarity of Sun Tzu and the precision of a quant.",
  keywords: ["stock analysis", "Thai stocks", "SET", "investment", "KongBeng"],
  authors: [{ name: "KongBeng" }],
  creator: "KongBeng",
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "KongBeng Strategist — Premium Stock Analysis",
    description: "AI-powered strategic stock analysis. Know what you own.",
    siteName: "KongBeng Strategist",
  },
  twitter: {
    card: "summary_large_image",
    title: "KongBeng Strategist",
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
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
