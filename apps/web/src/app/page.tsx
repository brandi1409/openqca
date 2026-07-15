import type { Metadata } from "next";
import { Landing } from "@/components/Landing";

export const metadata: Metadata = {
  title: "openQCA — Das offene Werkzeug für Qualitative Comparative Analysis",
};

export default function HomePage() {
  return <Landing />;
}
