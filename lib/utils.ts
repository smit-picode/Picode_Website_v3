import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge needs to know about our custom tokens, otherwise e.g.
 * `text-h1` would be treated as a text *color* and wrongly drop `text-gray-900`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-1",
            "display-2",
            "display-3",
            "h1",
            "h2",
            "h3",
            "body-xl",
            "body-lg",
            "body-md",
            "body-sm",
          ],
        },
      ],
      shadow: [{ shadow: ["soft", "inner-soft", "float", "glow"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
