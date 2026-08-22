"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [magicLink, setMagicLink] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send magic link");
        return;
      }

      if (data.magicLink) {
        setMagicLink(data.magicLink);
      }
      setSent(true);
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="text-center">
              <div className="text-6xl mb-6">✉️</div>
              <h1 className="text-h1 text-ink mb-2">Check your email</h1>
              <p className="text-body text-slate mb-8">
                We've sent a secure sign-in link to <br />
                <span className="font-600 text-ink">{email}</span>
              </p>
              <p className="text-small text-muted mb-8">
                Click the link to complete sign up. It expires in 24 hours.
              </p>

              {magicLink && (
                <Button
                  className="w-full mb-4"
                  onClick={() => (window.location.href = magicLink)}
                >
                  Sign in now
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSent(false);
                  setMagicLink("");
                }}
              >
                Back to sign up
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo + Header */}
        <div className="text-center mb-12">
          <div className="w-12 h-12 rounded-lg bg-accent-deep flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
            S
          </div>
          <h1 className="text-display font-serif font-600 text-ink mb-2">
            Senebiclabs
          </h1>
          <p className="text-body text-slate">
            Clinical review platform
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  type="email"
                  label="Email address"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <div className="bg-error bg-opacity-5 border border-error border-opacity-20 rounded-md p-4">
                  <p className="text-small text-error">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                Send sign-in link
              </Button>
            </form>

            <p className="text-caption text-muted text-center mt-6">
              We'll send a secure link to your email. No password needed.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-caption text-muted text-center mt-8">
          By signing up, you agree to our terms and privacy policy
        </p>
      </div>
    </div>
  );
}
