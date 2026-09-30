import type { Metadata } from "next";
import RenderQueue from "@/components/RenderQueue";

export const metadata: Metadata = { title: "Message sent", robots: { index: false } };

// Where the contact form lands after sending. No header: just the "render queue" finishing the visitor's message.
// ?name= is the sender's first name, used for the file name in the queue.
export default async function Thanks({ searchParams }: PageProps<"/thanks">) {
  const { name } = await searchParams;
  const slug = String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
  return <RenderQueue file={slug ? `message_from_${slug}.mp4` : "your_message.mp4"} />;
}
