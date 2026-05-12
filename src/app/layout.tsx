import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AH Datalytics — NHS Traffic Speed",
  description:
    "Monthly median traffic speeds on the National Highway System from FHWA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if(location.search.indexOf('embed=1')!==-1)document.documentElement.classList.add('in-iframe')`,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `.in-iframe .portal-bar{display:none!important}`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
