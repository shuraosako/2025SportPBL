"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

function LanguageHtmlWrapper({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <LanguageProvider>
          <LanguageHtmlWrapper>
            {children}
          </LanguageHtmlWrapper>
        </LanguageProvider>
      </body>
    </html>
  );
}
