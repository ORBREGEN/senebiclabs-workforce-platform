"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AgreementPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAccept = async () => {
    if (!accepted) {
      setError("You must accept the agreement to continue");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/agreement/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accepted: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to accept agreement");
        return;
      }

      router.push("/welcome");
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell showHeader={false}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display text-ink font-600 mb-2">
            Contributor Agreement
          </h1>
          <p className="text-body text-slate">
            Please review and accept our terms before proceeding
          </p>
        </div>

        <Card>
          <CardContent>
            {/* Agreement Text */}
            <div className="bg-bg rounded-lg p-6 mb-8 max-h-96 overflow-y-auto border border-hairline">
              <div className="space-y-6 text-small leading-relaxed text-slate">
                <div>
                  <h3 className="font-600 text-ink mb-2">
                    Senebiclabs Clinical Review Platform
                  </h3>
                  <p>
                    By accessing and using the Senebiclabs Clinical Review Platform
                    (the "Platform"), you agree to the following terms:
                  </p>
                </div>

                <div>
                  <h3 className="font-600 text-ink mb-2">1. Scope of Work</h3>
                  <p>
                    You will review clinical cases and provide annotations according
                    to the Platform's instructions. Your work will be used to improve
                    clinical decision-support systems.
                  </p>
                </div>

                <div>
                  <h3 className="font-600 text-ink mb-2">
                    2. Intellectual Property
                  </h3>
                  <p>
                    All annotations, insights, and feedback you provide become the
                    property of Senebiclabs and may be used, modified, or distributed
                    without further notice or compensation.
                  </p>
                </div>

                <div>
                  <h3 className="font-600 text-ink mb-2">3. Confidentiality</h3>
                  <p>
                    You acknowledge that clinical data on the Platform is confidential.
                    You agree not to disclose, share, or use this data outside the
                    Platform for any purpose.
                  </p>
                </div>

                <div>
                  <h3 className="font-600 text-ink mb-2">4. Data Privacy</h3>
                  <p>
                    Your usage data, annotations, and feedback will be collected and
                    processed. See our Privacy Policy for details.
                  </p>
                </div>

                <div>
                  <h3 className="font-600 text-ink mb-2">5. Liability</h3>
                  <p>
                    You use the Platform at your own risk. Senebiclabs is not liable
                    for errors, omissions, or outcomes resulting from annotations.
                  </p>
                </div>

                <p className="text-caption text-muted">
                  Version 1.0 — Updated August 2026
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-error bg-opacity-5 border border-error border-opacity-20 rounded-md p-4 mb-6">
                <p className="text-small text-error">{error}</p>
              </div>
            )}

            {/* Checkbox */}
            <label className="flex items-start gap-3 p-4 bg-accent bg-opacity-5 rounded-lg border border-accent border-opacity-20 mb-8 cursor-pointer hover:bg-opacity-10 transition-colors">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => {
                  setAccepted(e.target.checked);
                  if (e.target.checked) setError("");
                }}
                className="w-5 h-5 mt-1 rounded accent"
              />
              <span className="text-body text-ink">
                I have read and accept the Contributor Agreement. I understand that
                my annotations and data will become the property of Senebiclabs and
                used as described.
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                className="flex-1"
                disabled={!accepted || loading}
                loading={loading}
                onClick={handleAccept}
              >
                Accept & Continue
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.back()}
              >
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
