import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Better Auth mounts all its endpoints under /api/auth/*. This route is public
// (the middleware allow-lists it) so unauthenticated users can sign in.
export const { GET, POST } = toNextJsHandler(auth);
