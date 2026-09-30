"use client";

import { useActionState, useState } from "react";
import { sendContact, type ContactState } from "@/app/actions";
import type { SiteContent } from "@/data/site";
import { scrollToSection } from "@/lib/scroll";

const label = "font-mono text-[13px] tracking-[.06em] uppercase";
const field =
  "w-full rounded-none border-0 border-b-2 border-ink bg-transparent py-2 text-[clamp(18px,1.8vw,24px)] leading-[1.35] text-ink focus-visible:border-signal focus-visible:outline-none";
const button = "inline-flex items-center gap-3.5 border-2 border-ink px-5 py-3.5 font-mono text-[13px] tracking-[.06em] uppercase hover:bg-ink hover:text-paper";

export default function Contact({ person }: { person: SiteContent["person"] }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, { status: "idle", message: "" });
  const [copied, setCopied] = useState("Copy");

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(person.email);
      setCopied("Copied");
    } catch {
      setCopied("Press Ctrl+C");
    }
    setTimeout(() => setCopied("Copy"), 1800);
  };

  return (
    <section id="contact" className="px-5">
      <div className="mt-[70px] border-t-[3px] border-ink pt-2.5 pb-[18px]">
        <h2 className="m-0 font-display text-[clamp(34px,5vw,64px)] leading-[.9] uppercase">Contact</h2>
      </div>

      <div className="grid items-start gap-x-10 gap-y-5 pt-2.5 pb-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="grid content-start gap-[22px]">
          <p className="m-0 max-w-[30ch] text-[clamp(19px,2vw,26px)] leading-[1.35]">
            Got something that needs to move? Tell me what you&apos;re making and when it&apos;s due.
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <code className="font-mono text-[clamp(18px,2.2vw,30px)] leading-tight font-semibold select-all [overflow-wrap:anywhere]">{person.email}</code>
            <button type="button" onClick={copyEmail} className={`${button} px-3.5 py-2.5`}>
              {copied}
            </button>
          </div>
        </div>

        <form action={action} className="grid gap-[22px]">
          <label className="grid gap-1.5">
            <span className={label}>Name</span>
            <input name="name" autoComplete="name" required className={field} />
          </label>
          <label className="grid gap-1.5">
            <span className={label}>Email</span>
            <input name="email" type="email" autoComplete="email" required className={field} />
          </label>
          <label className="grid gap-1.5">
            <span className={label}>Message</span>
            <textarea name="message" rows={5} required className={`${field} resize-y`} />
          </label>
          {/* honeypot: hidden from people, bots fill it in */}
          <input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] size-px opacity-0" />
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={pending} className={`${button} disabled:opacity-50`}>
              {pending ? "Sending…" : "Send message"} <span aria-hidden="true">→</span>
            </button>
            <p role="status" className={`m-0 text-[15px] ${state.status === "error" ? "font-semibold underline decoration-signal decoration-2 underline-offset-4" : ""}`}>
              {state.message}
            </p>
          </div>
        </form>
      </div>

      <footer className="flex flex-wrap justify-between gap-3 pt-[22px] pb-[60px] font-mono text-[13px] tracking-[.06em] uppercase">
        <span>
          © {new Date().getFullYear()} {person.name}
        </span>
        <button type="button" onClick={() => scrollToSection("")} className="py-3 hover:text-signal">
          Back to top ↑
        </button>
      </footer>
    </section>
  );
}
