"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="border-b border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Senebiclabs</h1>
          </div>
        </nav>

        <main className="max-w-2xl mx-auto px-4 py-12">
          <div
            className={`rounded-lg border-2 p-8 ${
              result.passed
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="mb-6">
              <div className="text-5xl mb-4">
                {result.passed ? "✓" : "→"}
              </div>
              <h2
                className={`text-3xl font-bold mb-2 ${
                  result.passed ? "text-green-900" : "text-red-900"
                }`}
              >
                {result.passed ? "You're eligible!" : "Almost there"}
              </h2>
              <p
                className={`text-lg ${
                  result.passed ? "text-green-800" : "text-red-800"
                }`}
              >
                Score: {result.score}% ({result.correctAnswers}/{result.totalQuestions})
              </p>
            </div>

            {result.passed ? (
              <>
                <p className="text-gray-700 mb-8">
                  You've been marked as eligible for this pool. You can now start working and earning.
                </p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition duration-200"
                >
                  Go to Dashboard
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-700 mb-8">
                  You need to score at least 80% to become eligible. Please review the material and try again.
                </p>
                <button
                  onClick={() => {
                    setResult(null);
                    setSelectedPoolId("");
                    setCalibrationItems([]);
                    setAnswers({});
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200"
                >
                  Retake Calibration
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200 sticky top-0 z-10 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Senebiclabs</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
          >
            Back
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Calibration Test</h2>
          <p className="text-gray-600">
            Complete this assessment to become eligible for a task pool.
            You need to score 80% or higher to pass.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {!selectedPoolId ? (
          <div className="space-y-4">
            <p className="font-semibold text-gray-900 mb-4">Select a pool to calibrate:</p>
            {pools.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-600">No pools available</p>
              </div>
            ) : (
              pools.map((pool) => (
                <button
                  key={pool.id}
                  onClick={() => handlePoolSelect(pool.id)}
                  className="w-full bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg p-4 text-left transition group"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                    {pool.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Begin calibration</p>
                </button>
              ))
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-6"
          >
            {calibrationItems.map((item, index) => (
              <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <label className="block mb-4">
                  <span className="text-sm font-semibold text-gray-900">
                    {index + 1}. {item.question}
                  </span>
                </label>
                <div className="space-y-2">
                  {item.options?.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 p-3 rounded border border-gray-200 hover:bg-white transition cursor-pointer"
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
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                {submitting && (
                  <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                )}
                {submitting ? "Submitting..." : "Submit Assessment"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPoolId("");
                  setCalibrationItems([]);
                  setAnswers({});
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
