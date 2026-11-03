import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fund — Personal Decision Intelligence",
  description: "A private, searchable record of experiences, decisions, reasoning and lessons.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
