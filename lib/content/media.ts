/**
 * Video clips in /public/videos and where each one is used.
 * Posters (/public/videos/posters) are generated stills so pages paint
 * instantly; the MP4 only loads when the clip scrolls into view.
 *
 * Clips come in different shapes (16:9, square, 4:3); `ratio` records each
 * one so wide placements can show it uncropped instead of stretching it.
 *
 * Not used on purpose (they carry other brands' logos or off-topic captions):
 * 8153ba91…_720w.mp4, ab89fa54…_720w.mp4, c678f5ec…_720w.mp4.
 */
export type Clip = {
  src: string;
  poster: string;
  alt: string;
  /** Native width / height, so frames can show the clip uncropped. */
  ratio: number;
};

const clip = (name: string, alt: string, ratio = 16 / 9): Clip => ({
  src: `/videos/${name}.mp4`,
  poster: `/videos/posters/${name}.jpg`,
  alt,
  ratio,
});

export const clips = {
  aiBrain: clip("ai-brain-apps", "An AI brain streaming intelligence into apps on a phone"),
  appScreens: clip("app-screens-showcase", "Web and mobile app screens floating in 3D"),
  mobileChat: clip("mobile-chat-cards", "A phone app with conversation cards flowing out of it", 720 / 544),
  webLaptop: clip("web-coffee-laptop", "A modern web experience running on a laptop"),
  workflowDocs: clip("workflow-documents", "Documents flowing into a laptop for automated processing", 832 / 464),
  dataHologram: clip("data-dashboard-hologram", "A holographic AI dashboard with live business metrics", 1),
  digitalSphere: clip("digital-sphere", "A person surrounded by a sphere of digital screens"),
} satisfies Record<string, Clip>;

/** Clips for each service page, keyed by offering slug. */
export const offeringClips: Record<string, Clip[]> = {
  "agentic-modernization": [clips.aiBrain, clips.digitalSphere],
  "web-mobile": [clips.appScreens, clips.mobileChat],
  "workflow-automation": [clips.workflowDocs, clips.webLaptop],
  "data-driven-apps": [clips.dataHologram, clips.aiBrain],
};

/** One clip per case study, keyed by case-study slug. */
export const caseClips: Record<string, Clip> = {
  "ops-command-center": clips.dataHologram,
  "ai-claims-workflow": clips.workflowDocs,
  "legacy-portal-modernization": clips.webLaptop,
};

export const aboutClip = clips.digitalSphere;
