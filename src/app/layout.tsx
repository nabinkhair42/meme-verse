import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MemeVerse",
  description: "Create, share, and discover the best memes on the internet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "min-h-screen")}>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Toaster richColors position="top-center"/>
        </Providers>
      </body>
    </html>
  );
}
