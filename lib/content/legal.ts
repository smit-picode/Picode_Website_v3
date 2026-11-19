/**
 * Copy for /privacy and /terms.
 *
 * ⚠️ Written to match what this site actually does (contact form, theme
 * preference, admin login). Have it reviewed by legal counsel
 * before launch, and update `updated` whenever the text changes.
 *
 * Tokens replaced at render time:
 *   {email}   → general contact email from /admin settings (as a mailto link)
 *   {address} → headquarters address from /admin offices
 */

export type LegalBlock = string | { list: string[] };

export type LegalSection = {
  id: string;
  title: string;
  body: LegalBlock[];
};

export type LegalDocument = {
  title: string;
  eyebrow: string;
  summary: string;
  /** ISO date of the last change to the text. */
  updated: string;
  /** Short "at a glance" points shown above the full text. */
  highlights: { title: string; text: string }[];
  sections: LegalSection[];
};

export const privacyPolicy: LegalDocument = {
  title: "Privacy Policy",
  eyebrow: "Legal",
  summary:
    "What we collect when you use picode.ai, why we collect it, and the choices you have. We keep it short because we collect very little.",
  updated: "2026-11-17",
  highlights: [
    { title: "No ad tracking", text: "We don't use advertising cookies or sell your data. Ever." },
    { title: "Only what you send", text: "We store what you choose to share in the contact form, nothing more." },
    { title: "You stay in control", text: "Ask us to see, correct or delete your data at any time." },
  ],
  sections: [
    {
      id: "who-we-are",
      title: "Who we are",
      body: [
        "Picode (\"Picode\", \"we\", \"us\") builds software for businesses. This policy covers the website at picode.ai and any page that links to it. Picode is the controller of the personal data described here.",
        "Our registered office is at {address}. You can reach us about anything in this policy at {email}.",
      ],
    },
    {
      id: "what-we-collect",
      title: "What we collect",
      body: [
        "When you send us a message through the contact form or project brief, we receive:",
        {
          list: [
            "Your name, work email and, if you give it, your company name.",
            "Your message and any project details you select (type of project, stage, timeline and budget range).",
            "Technical details sent by your browser with the request: your IP address and browser user agent.",
          ],
        },
        "We don't ask for, and ask you not to send, sensitive information such as health data, government ID numbers or payment card details.",
      ],
    },
    {
      id: "how-we-use-it",
      title: "How we use it",
      body: [
        {
          list: [
            "To reply to your enquiry and, if you want, to prepare a proposal or start working together.",
            "To protect the site from spam and abuse, for example by limiting how often one IP address can submit the form.",
            "To keep the site running, fix problems and understand which pages are useful.",
            "To meet legal, accounting or regulatory obligations.",
          ],
        },
        "We rely on your request (taking steps before a contract), our legitimate interest in running and securing the site, and legal obligations where they apply. We don't use your data for automated decisions that affect you, and we don't send marketing emails unless you ask us to.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies and local storage",
      body: [
        "We don't use advertising or cross-site tracking cookies. The site only remembers your light or dark theme choice in your own browser, so it looks the way you left it.",
        "A session cookie is set only when a Picode team member signs in to the site's admin area. You can clear all of these at any time from your browser settings; the site keeps working without them.",
      ],
    },
    {
      id: "sharing",
      title: "Who we share it with",
      body: [
        "We don't sell or rent personal data. We share it only with service providers who help us run the site and our business, under contracts that require them to protect it:",
        {
          list: [
            "Hosting and infrastructure providers that store and serve the site.",
            "Tools we use to receive and manage enquiries, such as email, chat or CRM services.",
          ],
        },
        "We may also disclose data if the law requires it, or to protect the rights and safety of Picode, our clients or the public. If Picode is involved in a merger or acquisition, data may transfer to the new owner under this same policy.",
      ],
    },
    {
      id: "transfers",
      title: "International transfers",
      body: [
        "We work from India and the United Arab Emirates, and our providers may process data in other countries. Wherever your data goes, we take reasonable steps, including contractual safeguards, to make sure it's protected to the standard described here.",
      ],
    },
    {
      id: "retention",
      title: "How long we keep it",
      body: [
        "We keep enquiries for as long as we need them to talk with you and for up to 24 months after our last contact, unless we start working together, in which case project records follow our contract and legal obligations. Security logs are kept for a short period and then deleted.",
      ],
    },
    {
      id: "security",
      title: "Security",
      body: [
        "We use encrypted connections (HTTPS), restrict admin access to authorised team members, and rate-limit public forms. No system is perfectly secure, so if you believe something is wrong, tell us at {email} straight away.",
      ],
    },
    {
      id: "your-rights",
      title: "Your rights",
      body: [
        "Depending on where you live, including under the EU and UK GDPR, India's Digital Personal Data Protection Act and the UAE's data protection law, you can:",
        {
          list: [
            "Ask for a copy of the personal data we hold about you.",
            "Ask us to correct it, or to delete it.",
            "Object to or ask us to limit how we use it.",
            "Withdraw consent you've given, at any time.",
            "Complain to your local data protection authority.",
          ],
        },
        "Email {email} and we'll respond within 30 days. We may need to confirm your identity first.",
      ],
    },
    {
      id: "children",
      title: "Children",
      body: [
        "This site is meant for businesses and isn't directed at children under 16. We don't knowingly collect their data; if you think we have, contact us and we'll delete it.",
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      body: [
        "We'll update this page when our practices change and show the new date at the top. If a change is significant, we'll make it clear on the site.",
      ],
    },
  ],
};

export const termsOfService: LegalDocument = {
  title: "Terms of Service",
  eyebrow: "Legal",
  summary:
    "The rules for using picode.ai. Client projects are covered by their own signed agreement; these terms apply to the website itself.",
  updated: "2026-11-17",
  highlights: [
    { title: "Use it fairly", text: "Browse, share and get in touch. Just don't misuse or attack the site." },
    { title: "Our content is ours", text: "Text, design and code here belong to Picode or our partners." },
    { title: "Projects have contracts", text: "Paid work is governed by a separate agreement, not these terms." },
  ],
  sections: [
    {
      id: "agreement",
      title: "Agreeing to these terms",
      body: [
        "These terms apply to your use of picode.ai (the \"site\"), operated by Picode (\"Picode\", \"we\", \"us\"). By using the site you agree to them. If you don't agree, please don't use the site.",
        "If you use the site on behalf of a company, you confirm you're allowed to accept these terms for it.",
      ],
    },
    {
      id: "using-the-site",
      title: "Using the site",
      body: [
        "You're welcome to browse, read and share links to the site. When you do, please don't:",
        {
          list: [
            "Break the law or anyone else's rights.",
            "Try to gain unauthorised access to the site, its admin area or its servers.",
            "Interfere with the site's operation, for example by overloading it, spreading malware or bypassing rate limits.",
            "Scrape or copy the site in bulk, or use automated tools to submit forms.",
            "Send spam, false information or content that's abusive or unlawful through our forms.",
          ],
        },
        "We may restrict access for anyone who breaks these rules.",
      ],
    },
    {
      id: "enquiries",
      title: "Enquiries and client work",
      body: [
        "Sending us a message or project brief doesn't create a contract or oblige either of us to work together. Any project, dedicated team or retainer engagement is governed by a separate written agreement, which takes priority over these terms for that work.",
        "Information you share with us about your project is treated as confidential and used only to respond to you and prepare a proposal.",
      ],
    },
    {
      id: "intellectual-property",
      title: "Intellectual property",
      body: [
        "The site and everything on it, including text, graphics, logos, illustrations, video and code, belongs to Picode or our licensors and is protected by intellectual property law. You may view it and share links to it, but you may not copy, modify or reuse it commercially without our written permission.",
        "Client names, logos and case studies appear with permission or are clearly marked as illustrative. Third-party trademarks belong to their owners.",
      ],
    },
    {
      id: "third-party-links",
      title: "Links to other sites",
      body: [
        "The site may link to websites we don't control. We're not responsible for their content or practices, and a link isn't an endorsement.",
      ],
    },
    {
      id: "disclaimer",
      title: "Disclaimer",
      body: [
        "We work to keep the site accurate and available, but it's provided \"as is\" and \"as available\". Results shown in case studies describe specific projects and aren't a guarantee of future outcomes. To the extent the law allows, we make no warranties about the site, express or implied.",
      ],
    },
    {
      id: "liability",
      title: "Limitation of liability",
      body: [
        "To the extent the law allows, Picode isn't liable for any indirect, incidental or consequential loss, or loss of profit, data or business, arising from your use of the site. Nothing in these terms limits liability that can't be limited by law.",
      ],
    },
    {
      id: "law",
      title: "Governing law",
      body: [
        "These terms are governed by the laws of India. Any dispute about them will be handled by the courts of Bengaluru, Karnataka, unless the law where you live gives you the right to bring it elsewhere.",
      ],
    },
    {
      id: "changes",
      title: "Changes to these terms",
      body: [
        "We may update these terms from time to time. The date at the top shows the latest version, and continuing to use the site after a change means you accept it.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      body: ["Questions about these terms? Email {email} or write to us at {address}."],
    },
  ],
};
