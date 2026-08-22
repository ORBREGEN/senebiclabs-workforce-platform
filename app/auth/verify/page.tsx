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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {verifying ? (
          <>
            <div className="mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto"></div>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying your email
            </h1>
            <p className="text-gray-600">
              Please wait while we confirm your email address...
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h1>
            <p className="text-gray-700 mb-8">{error}</p>
            <a
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
            >
              Back to Sign Up
            </a>
          </>
        )}
      </div>
    </div>
  );
}
