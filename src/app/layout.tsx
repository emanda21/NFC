import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NFC Digital Business Card",
  description: "Share your digital business card instantly via NFC.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
