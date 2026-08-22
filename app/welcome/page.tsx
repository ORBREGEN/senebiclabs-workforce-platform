"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem("hasVisitedWelcome", "true");
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Senebiclabs
          </h1>
          <p className="text-lg text-gray-600">
            You're now set up to start reviewing clinical cases
          </p>
        </div>

        <div className="space-y-8 mb-12">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                How it works
              </h3>
              <p className="text-gray-600">
                You'll review clinical cases one at a time. Each case takes 2–5 minutes.
                Your feedback helps improve clinical decision-making systems.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                <span className="text-blue-600 font-bold text-lg">2</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Fair compensation
              </h3>
              <p className="text-gray-600">
                You're paid fairly based on task complexity and your time investment.
                Payments are processed weekly.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                <span className="text-blue-600 font-bold text-lg">3</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                We're here to help
              </h3>
              <p className="text-gray-600">
                Have questions? Email us anytime at{" "}
                <a
                  href="mailto:support@senebiclabs.com"
                  className="text-blue-600 font-semibold hover:text-blue-700"
                >
                  support@senebiclabs.com
                </a>
                . We respond within 24 hours.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200"
        >
          Start Working
        </button>
      </div>
    </div>
  );
}
