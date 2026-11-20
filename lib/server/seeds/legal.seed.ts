import "server-only";

import { privacyPolicy, termsOfService } from "@/lib/content/legal";
import type { Seeder } from "@/lib/server/seeds/types";

/**
 * The built-in Privacy Policy / Terms of Service text (lib/content/legal.ts), copied into
 * site_content once. After that the admin (Legal pages tab) owns it. The row key must match
 * `rowKey` in lib/server/legal-content.ts.
 */
function legalSeeder(key: "privacy" | "terms", doc: unknown): Seeder {
  return {
    name: `legal-${key}`,
    flag: `legal_${key}_seeded`,
    async run(client) {
      await client.query(
        `INSERT INTO site_content (key, data, updated_at) VALUES ($1, $2::jsonb, now())
         ON CONFLICT (key) DO NOTHING`,
        [`legal-${key}`, JSON.stringify(doc)],
      );
    },
  };
}

export const legalPrivacySeeder = legalSeeder("privacy", privacyPolicy);
export const legalTermsSeeder = legalSeeder("terms", termsOfService);
