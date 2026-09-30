import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

// Sanity calls this when the owner publishes (set up a webhook in sanity.io/manage → API → Webhooks,
// URL https://<your-domain>/api/revalidate, with the same secret as SANITY_REVALIDATE_SECRET).
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ message: "SANITY_REVALIDATE_SECRET is not set" }, { status: 500 });

  const { isValidSignature } = await parseBody(req, secret);
  if (!isValidSignature) return NextResponse.json({ message: "Invalid signature" }, { status: 401 });

  revalidateTag("site", "max");
  return NextResponse.json({ revalidated: true });
}
