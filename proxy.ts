import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  "/api/health",
  "/api/news",
  "/api/cron/publish",
  "/api/webhooks(.*)",
]);

const isCanvasidePreviewRoute = createRouteMatcher(["/canvaside-preview(.*)"]);
const isCanvasidePreviewEnabled =
  process.env.NODE_ENV === "development" &&
  process.env.CANVASIDE_PREVIEW_ENABLED === "true";

export default clerkMiddleware(async (auth, request) => {
  const isDevelopmentPreview =
    isCanvasidePreviewEnabled && isCanvasidePreviewRoute(request);

  if (!isPublicRoute(request) && !isDevelopmentPreview) {
    await auth.protect({ unauthenticatedUrl: new URL("/sign-in", request.url).toString() });
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk(.*)",
  ],
};
