import type { Metadata, Viewport } from "next";
import { Outfit, Poppins } from "next/font/google";
import { RouteLoader } from "@/components/layout/route-loader";
import { Providers } from "@/components/providers";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — AI-Native Software Engineering`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#060A13" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: next-themes sets the class before hydration.
    <html lang="en" className={`${outfit.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Providers>
          {children}
          <RouteLoader />
        </Providers>
      </body>
    </html>
  );
}
