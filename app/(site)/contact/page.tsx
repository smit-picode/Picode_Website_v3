import type { Metadata } from "next";
import { ContactSection } from "@/components/sections/contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start your project with Picode: a two-minute project brief, plus our Bengaluru and Dubai offices, phone numbers and emails.",
};

/** Project brief (contact form) + offices, emails and addresses. */
export default function ContactPage() {
  return <ContactSection />;
}
