import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import StoreHydration from "@/components/providers/StoreHydration";
import OfflineSyncProvider from "@/components/providers/OfflineSyncProvider";
import PwaRegister from "@/components/providers/PwaRegister";
import AuthHydrator from "@/components/providers/AuthHydrator";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UrbaReport Tehuacán",
  description: "Reporta incidencias urbanas en tu ciudad",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "UrbaReport",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#691c32",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${roboto.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-text">
        <StoreHydration>
          <AuthHydrator />
          <OfflineSyncProvider>
            <PwaRegister />
            {children}
          </OfflineSyncProvider>
        </StoreHydration>
      </body>
    </html>
  );
}
