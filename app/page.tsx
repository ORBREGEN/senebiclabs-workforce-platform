import { redirect } from "next/navigation";

/** Sign-in lives at /login; this keeps the old entry point working. */
export default function Home() {
  redirect("/login");
}
