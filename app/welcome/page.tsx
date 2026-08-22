"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const steps = [
  {
    title: "How it works",
    body: "You'll review clinical cases one at a time. Each case takes 2–5 minutes, and your judgment helps improve clinical decision-making systems.",
  },
  {
    title: "Fair compensation",
    body: "You're paid based on case complexity and the time you invest. Payments are processed weekly.",
  },
  {
    title: "We're here to help",
    body: "Questions are welcome any time — we respond within 24 hours.",
  },
];

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem("hasVisitedWelcome", "true");
  }, []);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-8 py-12">
      <div className="w-full max-w-[560px]">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-12">
          <div className="h-1 flex-1 rounded-full bg-teal" />
          <div className="h-1 flex-1 rounded-full bg-teal" />
          <div className="h-1 flex-1 rounded-full bg-teal" />
          <span className="text-caption text-muted uppercase ml-2">Step 3 of 3</span>
        </div>

        <div className="mb-12">
          <h1 className="text-display font-serif text-ink mb-3">
            Welcome to Senebiclabs
          </h1>
          <p className="text-body text-slate">
            You're set up and ready to begin reviewing.
          </p>
        </div>

        <div className="bg-surface border border-hairline rounded-lg shadow-sm p-6 mb-8">
          <div className="space-y-6 divide-y divide-hairline">
            {steps.map((step, idx) => (
              <div key={step.title} className="flex gap-4 pt-6 first:pt-0">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-soft flex items-center justify-center">
                  <span className="text-small font-semibold text-teal-deep">
                    {idx + 1}
                  </span>
                </div>
                <div>
                  <h2 className="text-h2 font-serif text-ink mb-1">
                    {step.title}
                  </h2>
                  <p className="text-body text-slate leading-relaxed">
                    {step.body}
                    {idx === 2 && (
                      <>
                        {" "}
                        <a
                          href="mailto:support@senebiclabs.com"
                          className="text-teal hover:text-teal-deep font-semibold"
                        >
                          support@senebiclabs.com
                        </a>
                      </>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => router.push("/dashboard")}
        >
          Start reviewing
        </Button>
      </div>
    </div>
  );
}
