import type { UiLayout } from "@project-forge/contracts";

export const uiLayoutLabels: Record<UiLayout, string> = {
  "single-column": "Single Column",
  "two-column": "Two Column",
  grid: "Grid",
  "split-screen": "Split Screen",
  magazine: "Magazine",
  "hero-landing": "Hero Landing",
};

export const uiLayoutDescriptions: Record<UiLayout, string> = {
  "single-column": "A calm, centered flow for focused content.",
  "two-column": "A sidebar keeps workspace navigation close by.",
  grid: "A flexible grid makes grouped content easy to scan.",
  "split-screen": "Two balanced panels pair context with the main task.",
  magazine: "A featured area gives supporting content clear hierarchy.",
  "hero-landing":
    "A prominent introduction leads into features and a call to action.",
};
