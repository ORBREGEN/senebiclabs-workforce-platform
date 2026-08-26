import { redirect } from "next/navigation";

/**
 * Earnings has no page while there is no real ledger to show.
 * Kept as a redirect so an old bookmark lands somewhere useful, not on a 404.
 */
export default function Earnings() {
  redirect("/account");
}
