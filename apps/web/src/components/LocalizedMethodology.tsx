"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/i18n/locale";

export function LocalizedMethodology({
  de,
  en,
}: {
  de: ReactNode;
  en: ReactNode;
}) {
  const [locale] = useLocale();
  return <>{locale === "en" ? en : de}</>;
}
