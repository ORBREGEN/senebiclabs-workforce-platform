"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApiError, api } from "@/lib/api";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [magicLink, setMagicLink] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await api.requestMagicLink(email);
      if (data.magicLink) setMagicLink(data.magicLink);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "That sign-in link could not be sent."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-5 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <p className="text-[18px] font-semibold tracking-tight text-ink">
            Senebiclabs
          </p>
          <p className="mt-1 text-body text-muted">Clinical review platform</p>
        </div>

        <Card className="p-6">
          {sent ? (
            <>
              <h1 className="text-section text-ink">Check your email</h1>
              <p className="mt-2 text-body text-muted">
                We sent a sign-in link to{" "}
                <span className="font-medium text-ink">{email}</span>. It works
                once and expires in 24 hours.
              </p>

              {magicLink && (
                <Button
                  className="mt-5 w-full"
                  onClick={() => (window.location.href = magicLink)}
                >
                  Open sign-in link
                </Button>
              )}

              <button
                onClick={() => {
                  setSent(false);
                  setMagicLink("");
                }}
                className="focusable mt-4 w-full rounded-btn text-[13px] font-medium text-accent underline-offset-2 hover:underline"
              >
                Use a different email
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <h1 className="text-section text-ink">Sign in</h1>
              <p className="mt-1 text-body text-muted">
                We will email you a link. There is no password to remember.
              </p>

              <label
                htmlFor="email"
                className="mb-1.5 mt-5 block text-label uppercase text-muted"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "signin-error" : undefined}
                className={`focusable h-10 w-full rounded-card border bg-surface px-3 text-body text-ink placeholder:text-muted ${
                  error ? "border-danger" : "border-hairline"
                }`}
              />

              {error && (
                <p id="signin-error" className="mt-2 text-[13px] text-danger">
                  {error}
                </p>
              )}

              <Button type="submit" loading={loading} className="mt-5 w-full">
                Email me a sign-in link
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
