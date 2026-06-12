// Site-wide configuration. Values marked VERIFY/PLACEHOLDER are on the
// owner's pre-launch list — see README.md.

export const SITE = {
  name: 'Tom Vranas',
  url: 'https://tomvranas.com',
  email: 'tom@tomvranas.com',

  // PLACEHOLDER — replace with the real Calendly/SavvyCal URL before launch.
  schedulingUrl: '{{SCHEDULING_URL}}',

  // PLACEHOLDER — Cloudflare Web Analytics token (Cloudflare dashboard →
  // Analytics & Logs → Web Analytics). Leave as-is and the snippet is omitted.
  analyticsToken: '{{ANALYTICS_TOKEN}}',

  // VERIFY these profile URLs before launch.
  linkedin: 'https://www.linkedin.com/in/tomvranas',
  medium: 'https://medium.com/@tomvranas',
  goodreads: 'https://www.goodreads.com/TomVranas',

  metaTitle:
    'Tom Vranas — COO, Chief of Staff & EOS Integrator | Operating Executive for Companies in Transition',
  metaDescription:
    'Second-seat operating executive for founders and PE-backed companies. Two exits, three integrations, every functional seat held. I make companies run.',
};
