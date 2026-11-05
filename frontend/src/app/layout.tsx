import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Incident AI — Production Investigator",
  description: "AI-powered incident investigation and root-cause analysis platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-porcelain">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
