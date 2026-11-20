import { JarvisLauncher } from "@/components/jarvis/jarvis-launcher";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { getPublicSettings, getWhatsAppNumber } from "@/lib/server/store";

/** Public marketing site chrome (the /admin area has its own layout). */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // The assistant's WhatsApp button: the number set in admin, else the HQ phone (none if switched off).
  const [settings, whatsapp] = await Promise.all([getPublicSettings(), getWhatsAppNumber()]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:shadow-float"
      >
        Skip to content
      </a>
      <SmoothScroll />
      <ScrollProgress />
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <JarvisLauncher whatsapp={whatsapp} responseTime={settings.responseTime} />
    </>
  );
}
