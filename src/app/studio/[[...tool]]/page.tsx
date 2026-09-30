import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";
import { isSanityConfigured } from "@/sanity/env";

export const dynamic = "force-static";
export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  if (!isSanityConfigured) {
    return (
      <main className="mx-auto grid max-w-[60ch] gap-4 px-5 py-16">
        <h1 className="font-display text-5xl uppercase">Dashboard not connected</h1>
        <p>
          Add <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> to <code>.env.local</code> (see <code>.env.example</code>), then restart the
          site. Until then the site shows the content from <code>src/data/site.ts</code>.
        </p>
      </main>
    );
  }
  return <NextStudio config={config} />;
}
