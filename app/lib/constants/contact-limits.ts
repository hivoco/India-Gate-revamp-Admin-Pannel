// What the contact form accepts. The browser enforces these with maxLength so
// someone cannot type past them, and the api enforces them again because a
// form is not the only way to post to it.

export const CONTACT_LIMITS = {
  name: 25,
  email: 100,
  mobile: 10,
  message: 200,
} as const;
