import type { Metadata } from "next";
import { Anton, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import { getContent } from "@/sanity/content";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" });
const plexMono = IBM_Plex_Mono({ weight: ["400", "600"], subsets: ["latin"], variable: "--font-plex-mono" });

export async function generateMetadata(): Promise<Metadata> {
  const { person } = await getContent();
  return { title: `${person.name} · ${person.role}`, description: person.intro };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${anton.variable} ${instrument.variable} ${plexMono.variable}`}>
      <body className="bg-paper font-body text-base leading-normal text-ink antialiased">{children}</body>
    </html>
  );
}
