import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that do NOT require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/proxy(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  console.log("[Proxy] Handling request path:", request.nextUrl.pathname);
  try {
    const isPublic = isPublicRoute(request);
    console.log("[Proxy] Route is public?", isPublic);
    if (!isPublic) {
      console.log("[Proxy] Protecting route...");
      await auth.protect();
      console.log("[Proxy] Route protected.");
    }
  } catch (error) {
    console.error("[Proxy] Clerk middleware error:", error);
    throw error;
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
