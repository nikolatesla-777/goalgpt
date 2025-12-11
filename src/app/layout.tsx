import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoalGPT Admin",
  description: "GoalGPT Admin Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" style={{ fontFamily: "'Satoshi', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
