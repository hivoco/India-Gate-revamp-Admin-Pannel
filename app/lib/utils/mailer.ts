// smtp transport and the transactional mail the panel sends.
//
// Config comes from env. The SMTP_* names are the real ones, but the older
// EMAIL_USER / EMAIL_PASS pair still works as a fallback so an existing
// .env.local keeps running without being edited.
//
//   SMTP_HOST    default smtp.gmail.com
//   SMTP_PORT    default 465
//   SMTP_SECURE  default true when the port is 465
//   SMTP_USER    falls back to EMAIL_USER
//   SMTP_PASS    falls back to EMAIL_PASS
//   SMTP_FROM    falls back to "India Gate <SMTP_USER>"
//
//   CONTACT_NOTIFY_TO   who gets told a contact form was filled in, falls back
//                       to the smtp account itself. comma separate for several
//   ADMIN_BASE_URL      the panel's own url, used to build the link in that
//                       notification, default http://localhost:3001
//
// Nothing here throws at the caller. Sending is best effort, a form submission
// is already saved by the time we try, so a mail failure must not turn a
// successful submission into an error for the visitor.

import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT ?? 465);
const user = process.env.SMTP_USER ?? process.env.EMAIL_USER;
const pass = process.env.SMTP_PASS ?? process.env.EMAIL_PASS;

const secure = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === "true"
  : port === 465;

export const mailFrom =
  process.env.SMTP_FROM ?? (user ? `India Gate <${user}>` : "");

// whoever should hear about a new enquiry. defaults to the account the mail is
// sent from, which is the india gate inbox
export const notifyTo = (process.env.CONTACT_NOTIFY_TO ?? user ?? "")
  .split(",")
  .map((address) => address.trim())
  .filter(Boolean);

export const adminBaseUrl =
  process.env.ADMIN_BASE_URL ?? "http://localhost:3001";

export const isMailConfigured = Boolean(user && pass);

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!isMailConfigured) return null;

  // one pooled transport for the process rather than one per send
  transporter ??= nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: user as string, pass: pass as string },
  });

  return transporter;
}

/** Opens an smtp connection and authenticates, without sending anything. */
export async function verifyMailer(): Promise<{
  ok: boolean;
  host: string;
  port: number;
  user?: string;
  error?: string;
}> {
  const transport = getTransporter();

  if (!transport) {
    return { ok: false, host, port, error: "SMTP credentials are not set" };
  }

  try {
    await transport.verify();

    return { ok: true, host, port, user };
  } catch (error) {
    return {
      ok: false,
      host,
      port,
      user,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const BRAND = "#672E1F";

function acknowledgementHtml(name: string) {
  return `
  <div style="margin:0;padding:24px;background:#F8F6F3;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E7E2DC;">
      <div style="background:${BRAND};padding:24px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:1px;">
          INDIA GATE BASMATI RICE
        </h1>
      </div>
      <div style="padding:28px 28px 32px;color:#2E211B;">
        <h2 style="margin:0 0 12px;font-size:20px;color:${BRAND};">Thank you for reaching out</h2>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
          Hi ${name},
        </p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
          Thank you for getting in touch with us. We have received your message
          and our team will get back to you shortly.
        </p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
          We appreciate your interest in India Gate.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.6;">
          Warm regards,<br />
          <strong>Team India Gate</strong>
        </p>
      </div>
      <div style="padding:16px 28px;background:#FAF8F6;border-top:1px solid #E7E2DC;color:#6A5A50;font-size:12px;">
        This is an automated confirmation, there is no need to reply to it.
      </div>
    </div>
  </div>`;
}

function acknowledgementText(name: string) {
  return [
    `Hi ${name},`,
    "",
    "Thank you for getting in touch with us. We have received your message and our team will get back to you shortly.",
    "",
    "We appreciate your interest in India Gate.",
    "",
    "Warm regards,",
    "Team India Gate",
    "",
    "This is an automated confirmation, there is no need to reply to it.",
  ].join("\n");
}

/**
 * Sends the "thanks, we'll get back to you" note to whoever filled the contact
 * form. Resolves either way, the boolean just says whether it went out.
 */
export async function sendContactAcknowledgement(
  to: string,
  name: string,
): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    console.warn("Contact acknowledgement skipped, SMTP is not configured.");
    return false;
  }

  try {
    await transport.sendMail({
      from: mailFrom,
      to,
      subject: "Thank you for contacting India Gate",
      text: acknowledgementText(name),
      html: acknowledgementHtml(name),
    });

    return true;
  } catch (error) {
    console.error("Contact acknowledgement failed to send:", error);
    return false;
  }
}

// the notification is a nudge to go and read the enquiry, not the enquiry
// itself, so the message is cut short and the full text stays in the panel
const MESSAGE_PREVIEW_LENGTH = 80;

function previewMessage(message: string) {
  const clean = message.trim();

  return clean.length > MESSAGE_PREVIEW_LENGTH
    ? `${clean.slice(0, MESSAGE_PREVIEW_LENGTH).trimEnd()}...`
    : clean;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function notificationHtml(contact: {
  name: string;
  email: string;
  mobile: string | null;
  message: string;
}) {
  const contactsUrl = `${adminBaseUrl}/contacts`;

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:6px 0;color:#6A5A50;font-size:13px;width:110px;vertical-align:top;">${label}</td>
      <td style="padding:6px 0;color:#2E211B;font-size:14px;">${value}</td>
    </tr>`;

  return `
  <div style="margin:0;padding:24px;background:#F8F6F3;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E7E2DC;">
      <div style="background:${BRAND};padding:20px 24px;">
        <h1 style="margin:0;color:#ffffff;font-size:17px;">
          New contact form enquiry
        </h1>
      </div>
      <div style="padding:24px 28px 28px;color:#2E211B;">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
          Someone filled in the contact form on the website. Here is what they sent.
        </p>

        <table style="width:100%;border-collapse:collapse;border-top:1px solid #E7E2DC;border-bottom:1px solid #E7E2DC;margin-bottom:20px;">
          ${row("Name", escapeHtml(contact.name))}
          ${row("Email", `<a href="mailto:${encodeURIComponent(contact.email)}" style="color:${BRAND};">${escapeHtml(contact.email)}</a>`)}
          ${row("Mobile", contact.mobile ? escapeHtml(contact.mobile) : "not given")}
          ${row("Message", escapeHtml(previewMessage(contact.message)).replace(/\n/g, "<br />"))}
        </table>

        <a href="${contactsUrl}"
           style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:bold;">
          Open Contacts in the admin panel
        </a>

        <p style="margin:16px 0 0;font-size:12px;color:#6A5A50;">
          Or go to <a href="${contactsUrl}" style="color:${BRAND};">${contactsUrl}</a>
        </p>
      </div>
    </div>
  </div>`;
}

function notificationText(contact: {
  name: string;
  email: string;
  mobile: string | null;
  message: string;
}) {
  return [
    "Someone filled in the contact form on the website.",
    "",
    `Name:    ${contact.name}`,
    `Email:   ${contact.email}`,
    `Mobile:  ${contact.mobile ?? "not given"}`,
    "",
    "Message:",
    previewMessage(contact.message),
    "",
    `Open Contacts in the admin panel: ${adminBaseUrl}/contacts`,
  ].join("\n");
}

/**
 * Tells the team a contact form was filled in, with the enquiry itself and a
 * link straight into the panel.
 *
 * Best effort like the acknowledgement, the enquiry is already saved by the
 * time this runs and a mail failure must not fail the submission.
 */
export async function sendContactNotification(contact: {
  name: string;
  email: string;
  mobile: string | null;
  message: string;
}): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    console.warn("Contact notification skipped, SMTP is not configured.");
    return false;
  }

  if (!notifyTo.length) {
    console.warn("Contact notification skipped, no CONTACT_NOTIFY_TO set.");
    return false;
  }

  try {
    await transport.sendMail({
      from: mailFrom,
      to: notifyTo,
      // replying from the inbox goes straight back to the person who wrote in
      replyTo: contact.email || undefined,
      subject: `New contact enquiry from ${contact.name || "the website"}`,
      text: notificationText(contact),
      html: notificationHtml(contact),
    });

    return true;
  } catch (error) {
    console.error("Contact notification failed to send:", error);
    return false;
  }
}
