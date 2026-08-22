"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setError("No token provided");
        setVerifying(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Verification failed");
          setVerifying(false);
          return;
        }

        router.push("/agreement");
      } catch (err) {
        setError("An error occurred during verification");
        setVerifying(false);
      }
    };

    verifyToken();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-8 py-12">
      <div className="w-full max-w-[560px]">
        <div className="bg-surface border border-hairline rounded-lg shadow-sm p-12 text-center">
          {verifying ? (
            <>
              <div className="w-10 h-10 mx-auto mb-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
              <h1 className="text-h1 font-serif text-ink mb-2">
                Signing you in
              </h1>
              <p className="text-body text-slate">
                One moment while we confirm your email.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-h1 font-serif text-ink mb-3">
                We couldn't verify that link
              </h1>
              <p className="text-body text-slate mb-8">{error}</p>
              <a
                href="/"
                className="inline-flex items-center justify-center h-12 px-6 bg-teal-deep hover:bg-teal text-white font-semibold rounded-md transition-all duration-160"
              >
                Back to sign in
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
