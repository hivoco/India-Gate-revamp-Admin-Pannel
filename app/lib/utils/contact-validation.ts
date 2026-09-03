import { CONTACT_LIMITS } from "@/app/lib/constants/contact-limits";

// Server side checks for the contact form.
//
// the browser enforces the same rules with required, maxLength and pattern, but
// a form is only one of the ways to post here. everything that arrives is
// checked again from scratch, on the assumption the client did nothing at all.

export interface CleanContact {
  name: string;
  email: string;
  mobile_no: string | null;
  message: string;
}

export type ContactCheck =
  | { ok: true; value: CleanContact }
  | { ok: false; error: string };

// a name reads as letters, spaces and the punctuation that turns up inside real
// names. no digits, no slashes, no angle brackets, so a url or a tag cannot be
// what someone is called
const NAME = /^\p{L}[\p{L}\p{M}\p{Zs}'’.\-]*$/u;

// deliberately not the rfc grammar, that accepts far more than any mailbox in
// use. one local part, one domain with at least one dot, no whitespace
const EMAIL = /^[^\s@,;:<>()[\]\\"]{1,64}@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;

// indian mobile numbers, which is what the form asks for and what the ten
// character cap allows for
const MOBILE = /^[6-9]\d{9}$/;

// json can carry a number, an array or an object under any of these keys and
// none of them have a meaningful .length. an array holding one long string
// reads as length 1, so it walked straight past a cap that only measured
// .length. anything that is not a string is refused before it is measured
function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

// tags go first so the text inside them survives. the zero width formatting
// characters are dropped rather than spaced out, they sit mid word and a space
// would split the name. control characters become spaces, they were separators
// to begin with, then the runs a paste leaves behind are collapsed
function cleanLine(value: string): string {
  return value
    .normalize("NFC")
    .replace(/<[^>]*>/g, " ")
    .replace(/\p{Cf}/gu, "")
    .replace(/\p{Cc}/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// same treatment for the message, except its paragraph breaks are meant to be
// there, so newlines survive and only pile ups are trimmed back
function cleanText(value: string): string {
  return value
    .normalize("NFC")
    .replace(/<[^>]*>/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/\p{Cf}/gu, "")
    .replace(/\p{Cc}/gu, (ch) => (ch === "\n" ? ch : " "))
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

// a value made only of punctuation passes a length check and says nothing
const hasLetter = (value: string) => /\p{L}/u.test(value);

export function validateContact(body: unknown): ContactCheck {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Invalid request." };
  }

  const raw = body as Record<string, unknown>;

  const rawName = asString(raw.name);
  const rawEmail = asString(raw.email);
  const rawMessage = asString(raw.message);

  if (rawName === null || rawEmail === null || rawMessage === null) {
    return { ok: false, error: "Name, email and message are required." };
  }

  const name = cleanLine(rawName);
  const email = cleanLine(rawEmail).toLowerCase();
  const message = cleanText(rawMessage);

  if (!name || !email || !message) {
    return { ok: false, error: "Name, email and message are required." };
  }

  // measured after cleaning, so padding a value with tags or zero width
  // characters cannot be used to smuggle length past the cap
  if (name.length > CONTACT_LIMITS.name) {
    return { ok: false, error: `Name must be ${CONTACT_LIMITS.name} characters or fewer.` };
  }

  if (name.length < 2 || !NAME.test(name)) {
    return { ok: false, error: "Please enter your name using letters only." };
  }

  if (email.length > CONTACT_LIMITS.email) {
    return { ok: false, error: `Email must be ${CONTACT_LIMITS.email} characters or fewer.` };
  }

  if (!EMAIL.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  if (message.length > CONTACT_LIMITS.message) {
    return { ok: false, error: `Message must be ${CONTACT_LIMITS.message} characters or fewer.` };
  }

  if (message.length < 2 || !hasLetter(message)) {
    return { ok: false, error: "Please tell us a little more in your message." };
  }

  // the browser asks for this one, anything posting directly may leave it out.
  // it is only rejected when it is present and does not look like a number
  const rawMobile = raw.mobile ?? raw.mobile_no;
  let mobile_no: string | null = null;

  if (rawMobile !== undefined && rawMobile !== null && rawMobile !== "") {
    const supplied = asString(rawMobile);

    if (supplied === null) {
      return { ok: false, error: "Please enter a valid 10 digit mobile number." };
    }

    // a pasted number arrives with spaces, dashes, brackets or a country code
    const digits = supplied
      .replace(/\D/g, "")
      .replace(/^0+/, "")
      .replace(/^91(?=\d{10}$)/, "");

    if (!MOBILE.test(digits)) {
      return { ok: false, error: "Please enter a valid 10 digit mobile number." };
    }

    mobile_no = digits;
  }

  return { ok: true, value: { name, email, mobile_no, message } };
}
