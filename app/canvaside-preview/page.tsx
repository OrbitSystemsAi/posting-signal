import { notFound } from "next/navigation";
import CanvasidePreviewClient from "./canvaside-preview-client";

export const dynamic = "force-dynamic";

export default function CanvasidePreviewPage() {
  const previewEnabled =
    process.env.NODE_ENV === "development" &&
    process.env.CANVASIDE_PREVIEW_ENABLED === "true";

  if (!previewEnabled) {
    notFound();
  }

  return <CanvasidePreviewClient />;
}
