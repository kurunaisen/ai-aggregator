/** Runway text-to-video via POST /v1/text_to_video */
export type RunwayTextToVideoModel = "gen4.5";

export const RUNWAY_TEXT_TO_VIDEO_MODEL: RunwayTextToVideoModel = "gen4.5";

/** Runway API expects pixel ratios, e.g. 1280:720 (16:9). */
export const RUNWAY_DEFAULT_RATIO = "1280:720";

export const RUNWAY_RATIO_OPTIONS = [
  { value: "1280:720", label: "16:9 (1280×720)" },
  { value: "720:1280", label: "9:16 (720×1280)" },
  { value: "960:960", label: "1:1 (960×960)" },
] as const;
