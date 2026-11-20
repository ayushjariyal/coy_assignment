import type { Metadata, Viewport } from "next";
import { TabBar } from "@/components/TabBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coy · Discover",
  description: "Swipe-based discovery tab prototype for Coy.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Mobile-first "app frame": full-screen on phones, centred column on desktop. */}
        <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-white sm:my-0 sm:border-x sm:border-neutral-200 sm:shadow-xl">
          <main className="relative flex min-h-0 flex-1 flex-col">{children}</main>
          <TabBar />
        </div>
      </body>
    </html>
  );
}
