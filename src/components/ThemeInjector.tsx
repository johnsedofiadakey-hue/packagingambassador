"use client";

import { useEffect } from "react";
import { useAdminData } from "@/lib/store";

const VAR_MAP = {
  primaryColor: "--theme-primary",
  secondaryColor: "--theme-secondary",
  accentColor: "--theme-accent",
  textColor: "--theme-text",
  backgroundColor: "--theme-background",
} as const;

/**
 * Overrides the --theme-* CSS custom properties (defined with defaults in globals.css) with
 * the admin's saved colors from Firestore. Every Tailwind color utility in the app derives
 * from these five variables via color-mix(), so this one component recolors the whole site —
 * no other component needs to know about theming.
 */
export function ThemeInjector() {
  const { settings } = useAdminData();
  const theme = settings.theme;

  useEffect(() => {
    const root = document.documentElement.style;
    (Object.keys(VAR_MAP) as Array<keyof typeof VAR_MAP>).forEach((key) => {
      const value = theme[key];
      if (value) root.setProperty(VAR_MAP[key], value);
    });
  }, [theme]);

  return null;
}
