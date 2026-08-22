"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";

interface CalibrationItem {
  id: number;
  question: string;
  options: string[];
  correct_option: string;
}

export default function CalibrationPage() {
  const router = useRouter();
  const [pools, setPools] = useState<any[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<string>("");
  const [calibrationItems, setCalibrationItems] = useState<CalibrationItem[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const res = await fetch("/api/dashboard", {
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load pools");
          return;
        }

        setPools(data.pools || []);
      } catch (err) {
        setError("An error occurred while loading pools");
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, [router]);

  const handlePoolSelect = async (poolId: string) => {
    setSelectedPoolId(poolId);
    setAnswers({});
    setResult(null);

    try {
      const res = await fetch("/api/dashboard", {
        credentials: "include",
      });
      const data = await res.json();

      const pool = data.pools.find((p: any) => p.id === poolId);
      setCalibrationItems([
        {
          id: 1,
          question: "What is the primary concern?",
          options: ["Infection", "Inflammation", "Fracture"],
          correct_option: "Infection",
        },
        {
          id: 2,
          question: "What is the recommended action?",
          options: ["Antibiotics", "Rest", "Surgery"],
          correct_option: "Antibiotics",
        },
      ]);
    } catch (err) {
      console.error("Failed to fetch pool items", err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPoolId || Object.keys(answers).length === 0) {
      setError("Please answer all questions");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/calibration/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          poolId: selectedPoolId,
          answers: Object.entries(answers).map(([itemId, answer]) => ({
            itemId: parseInt(itemId),
            answer,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Calibration failed");
        setSubmitting(false);
        return;
      }

      setResult(data);
    } catch (err) {
      setError("An error occurred while submitting calibration");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-[560px]">
          <div className="bg-surface border border-hairline rounded-lg shadow-sm p-12 text-center">
            <h1 className="text-h1 font-serif text-ink mb-3">
              {result.passed ? "You're qualified" : "Not quite yet"}
            </h1>

            <div className="bg-teal-soft rounded-lg p-6 mb-8">
              <p className="text-display font-serif text-teal-deep mb-1">
                {result.score}%
              </p>
              <p className="text-small text-slate">
                {result.correctAnswers} of {result.totalQuestions} correct
              </p>
            </div>

            <p className="text-body text-slate mb-8 leading-relaxed">
              {result.passed
                ? "You're now eligible for this project. Your review work can begin whenever you're ready."
                : "A score of 80% or higher is needed to qualify. Take a moment with the material and try again when you're ready."}
            </p>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                if (result.passed) {
                  router.push("/dashboard");
                } else {
                  setResult(null);
                  setSelectedPoolId("");
                  setCalibrationItems([]);
                  setAnswers({});
                }
              }}
            >
              {result.passed ? "Go to projects" : "Try again"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="max-w-[720px] mx-auto">
        <div className="mb-12">
          <h1 className="text-display font-serif text-ink mb-3">
            Qualification assessment
          </h1>
          <p className="text-body text-slate">
            Complete this short assessment to qualify for a project. A score of
            80% or higher is needed to pass.
          </p>
        </div>

        {error && (
          <div className="bg-error bg-opacity-10 border border-error rounded-lg p-4 mb-8">
            <p className="text-body font-semibold text-error">{error}</p>
          </div>
        )}

        {!selectedPoolId ? (
          <div>
            <h2 className="text-h2 font-serif text-ink mb-4">
              Choose a project
            </h2>
            {pools.length === 0 ? (
              <div className="bg-surface border border-hairline rounded-lg p-12 text-center">
                <p className="text-body text-slate">
                  No projects are available for qualification right now.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pools.map((pool) => (
                  <button
                    key={pool.id}
                    onClick={() => handlePoolSelect(pool.id)}
                    className="w-full bg-surface border border-hairline hover:border-teal hover:shadow-md rounded-lg p-6 text-left transition-all duration-160 group"
                  >
                    <h3 className="text-h2 font-serif text-ink group-hover:text-teal transition-colors duration-160">
                      {pool.name}
                    </h3>
                    <p className="text-small text-slate mt-1">
                      Begin qualification
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="bg-surface border border-hairline rounded-lg p-8"
          >
            <div className="space-y-8 divide-y divide-hairline">
              {calibrationItems.map((item, index) => (
                <div key={item.id} className="pt-8 first:pt-0">
                  <p className="text-h2 font-serif text-ink mb-4">
                    {index + 1}. {item.question}
                  </p>
                  <div className="space-y-2">
                    {item.options?.map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-3 p-3 rounded-md border border-hairline hover:border-teal hover:bg-teal-soft transition-all duration-160 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`item-${item.id}`}
                          value={option}
                          checked={answers[item.id] === option}
                          onChange={(e) =>
                            setAnswers({
                              ...answers,
                              [item.id]: e.target.value,
                            })
                          }
                          className="w-4 h-4 text-teal"
                        />
                        <span className="text-body text-ink">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-8 mt-8 border-t border-hairline">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                className="flex-1"
              >
                Submit assessment
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => {
                  setSelectedPoolId("");
                  setCalibrationItems([]);
                  setAnswers({});
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
