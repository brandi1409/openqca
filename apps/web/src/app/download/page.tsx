import type { Metadata } from "next";
import { DownloadPage } from "@/components/DownloadPage";

export const metadata: Metadata = {
  title: "Download",
};

export default function Page() {
  return <DownloadPage />;
}
