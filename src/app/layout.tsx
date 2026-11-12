import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  description: "A considered collection, composed around you. An adaptive, white-label shopping experience."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}