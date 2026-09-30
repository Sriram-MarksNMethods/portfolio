"use server";

import nodemailer from "nodemailer";
import { redirect } from "next/navigation";

export type ContactState = { status: "idle" | "sent" | "error"; message: string };

// Sends the contact form to the owner's inbox through Gmail SMTP (free).
// Needs these in .env.local (see .env.example):
//   GMAIL_USER          the Gmail address that sends and receives
//   GMAIL_APP_PASSWORD  a Google "app password" (requires 2-Step Verification on that account)
export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // bots fill every field, people never see this one
  if (formData.get("company")) redirect("/thanks");

  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const message = String(formData.get("message") ?? "").trim().slice(0, 5000);

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please fill in your name, a valid email and a message." };
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.error("Contact form: GMAIL_USER / GMAIL_APP_PASSWORD are not set");
    return { status: "error", message: "The form isn't connected yet. Please email me directly." };
  }

  try {
    const transport = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
    await transport.sendMail({
      from: `Portfolio contact form <${user}>`,
      to: user,
      replyTo: `${name} <${email}>`,
      subject: `New message from ${name}`,
      text: `${message}\n\n— ${name} <${email}>`,
    });
  } catch (error) {
    console.error("Contact form: sending failed", error);
    return { status: "error", message: "Something went wrong sending that. Please email me directly." };
  }
  // Sent: on to the thank-you page (outside the try, since redirect() works by throwing).
  redirect(`/thanks?name=${encodeURIComponent(name.split(/\s+/)[0])}`);
}
