import { redirect } from "next/navigation";

// The app has no standalone landing page — the Dashboard is the authenticated
// home. Unauthenticated users are bounced to /login by the middleware before
// this runs; authenticated users land on the Dashboard.
export default function Home() {
  redirect("/dashboard");
}
