"use client";

import { useState, useMemo, useEffect, useRef } from "react";

interface Field {
  name: string;
  type: "single" | "from_classes" | "text" | "scale" | "flag" | "structured";
  title: string;
  hint?: string;
  options?: string[];
  classes?: string[];
  max?: number;
  rows?: number;
  label?: string;
  required?: boolean;
  visible_when?: string;
}

interface ContextBlock {
  label: string;
  content?: string;
}

interface EvalConfig {
  instructions?: string;
  schema: {
    fields: Record<string, Omit<Field, "name">>;
    input?: {
      type: "text" | "image" | "audio" | "video";
      context?: string[];
    };
    context?: ContextBlock[];
    classes?: string[];
  };
}

interface AnnotationWidgetProps {
  evalConfig: EvalConfig;
  taskData: any;
  poolId: string;
  taskId: number;
  onSubmit: (annotation: any) => Promise<void>;
  onFlag?: () => Promise<void>;
}

export function AnnotationWidget({
  evalConfig,
  taskData,
  poolId,
  taskId,
  onSubmit,
  onFlag,
}: AnnotationWidgetProps) {
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  // Convert fields dict to array
  const fieldsDict = evalConfig?.schema?.fields || {};
  const fields: Field[] = Object.entries(fieldsDict).map(([name, config]) => ({
    name,
    ...config,
  }));

  const classes = evalConfig?.schema?.classes || [];
  const instructions = evalConfig?.instructions;
  const contextBlocks = evalConfig?.schema?.context || [];

  // Persist form data
  useEffect(() => {
    const saved = localStorage.getItem(`task-${taskId}`);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, [taskId]);

  useEffect(() => {
    localStorage.setItem(`task-${taskId}`, JSON.stringify(formData));
  }, [formData, taskId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isFieldVisible = (field: Field): boolean => {
    if (!field.visible_when) return true;
    const match = field.visible_when.match(/(\w+)([!=]=)(.+)/);
    if (!match) return true;
    const [, fieldName, operator, expectedValue] = match;
    const actualValue = formData[fieldName];
    if (operator === "!=") return actualValue !== expectedValue;
    if (operator === "==") return actualValue === expectedValue;
    return true;
  };

  const visibleFields = useMemo(
    () => fields.filter(isFieldVisible),
    [fields, formData]
  );

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const formatAnnotation = () => {
    const result = [];

    for (const field of visibleFields) {
      const value = formData[field.name];

      switch (field.type) {
        case "single":
        case "from_classes": {
          result.push({
            from_name: field.name,
            to_name: "image",
            type: "choices",
            value: {
              choices: [value || ""],
            },
          });
          break;
        }

        case "text": {
          result.push({
            from_name: field.name,
            to_name: "image",
            type: "textarea",
            value: {
              text: [value || ""],
            },
          });
          break;
        }

        case "scale": {
          result.push({
            from_name: field.name,
            to_name: "image",
            type: "rating",
            value: {
              rating: parseInt(value) || 1,
            },
          });
          break;
        }

        case "flag": {
          result.push({
            from_name: field.name,
            to_name: "image",
            type: "choices",
            value: {
              choices: value ? [field.label || "yes"] : [],
            },
          });
          break;
        }

        case "structured": {
          const yesNo = formData[`${field.name}_yn`] || "No";
          const finding = formData[`${field.name}_finding`] || "";

          result.push({
            from_name: field.name,
            to_name: "image",
            type: "choices",
            value: {
              choices: [yesNo],
            },
          });

          result.push({
            from_name: `${field.name}_finding`,
            to_name: "image",
            type: "choices",
            value: {
              choices: finding ? [finding] : [],
            },
          });
          break;
        }
      }
    }

    return { result };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    for (const field of visibleFields) {
      if (field.required && !formData[field.name]) {
        setError(`${field.title} is required`);
        setSubmitting(false);
        return;
      }

      if (field.type === "structured" && formData[`${field.name}_yn`] === "Yes") {
        if (!formData[`${field.name}_finding`]) {
          setError(`${field.title}: please select a finding`);
          setSubmitting(false);
          return;
        }
      }
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const annotation = formatAnnotation();
        await onSubmit(annotation);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
        setFormData({});
        setSubmitting(false);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Unknown error");

        if (attempt < maxRetries) {
          const isTransient =
            lastError.message.includes("Failed to fetch") ||
            lastError.message.includes("500") ||
            lastError.message.includes("network");

          if (isTransient) {
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
            );
            continue;
          }
        }
        break;
      }
    }

    setError(lastError?.message || "Failed to save. Try again.");
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop: Two-column layout (Guidelines + Content) */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6 p-6 max-w-7xl mx-auto">
        {/* Left: Guidelines Panel */}
        {instructions && (
          <div className="lg:col-span-1 sticky top-6 h-fit">
            <div className="bg-surface border border-hairline rounded-lg shadow-xs p-5">
              <h3 className="text-h2 text-ink mb-4">Guidelines</h3>
              <p className="text-small text-slate leading-relaxed whitespace-pre-wrap">
                {instructions}
              </p>
            </div>
          </div>
        )}

        {/* Right: Task Content */}
        <div className={instructions ? "lg:col-span-3" : "lg:col-span-4"}>
          {/* Context blocks */}
          {contextBlocks.length > 0 && (
            <div className="bg-surface border border-hairline rounded-lg shadow-xs p-6 mb-6">
              <div className="space-y-5">
                {contextBlocks.map((block, idx) => (
                  <div key={idx}>
                    <p className="text-caption font-semibold text-muted uppercase tracking-wide mb-2">
                      {block.label}
                    </p>
                    <p className="text-body text-slate leading-relaxed">
                      {block.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task data - main content */}
          {taskData?.data?.case_id && (
            <div className="mb-4">
              <p className="text-caption font-semibold text-muted uppercase tracking-wide mb-1">
                Case ID
              </p>
              <p className="text-h1 text-ink">{taskData.data.case_id}</p>
            </div>
          )}

          {(taskData?.data?.prompt || taskData?.prompt) && (
            <div className="mb-8">
              <p className="text-h1 text-ink leading-relaxed font-semibold">
                {taskData?.data?.prompt || taskData?.prompt}
              </p>
            </div>
          )}

          {/* Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="bg-surface border border-hairline rounded-lg shadow-xs p-8">
            <h2 className="text-h1 text-ink mb-1">Your Assessment</h2>
            <p className="text-body text-slate mb-8">
              Answer the {visibleFields.length}{" "}
              {visibleFields.length === 1 ? "question" : "questions"} below
            </p>

            {error && (
              <div className="bg-error/10 border border-error rounded-lg p-4 mb-8">
                <p className="text-small font-semibold text-error">⚠️ {error}</p>
              </div>
            )}

            <div className="space-y-8">
              {visibleFields.map((field, idx) => (
                <div key={field.name} className="pb-8 border-b border-hairline last:border-b-0 last:pb-0">
                  {/* Field label + hint */}
                  <div className="mb-4">
                    <label className="text-h2 text-ink font-semibold">
                      {field.title}
                      {field.required && <span className="text-error ml-1">*</span>}
                    </label>
                    {field.hint && (
                      <p className="text-small text-slate mt-2">{field.hint}</p>
                    )}
                  </div>

                  {/* Field control */}
                  <div className="space-y-3">
                    {(field.type === "single" || field.type === "from_classes") && (
                      <div className="space-y-2">
                        {(field.type === "single" ? field.options : field.classes || classes)?.map(
                          (option) => (
                            <label
                              key={option}
                              className="flex items-center gap-3 p-3 rounded-md border border-hairline hover:border-accent hover:bg-accent/5 transition cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={field.name}
                                value={option}
                                checked={formData[field.name] === option}
                                onChange={(e) =>
                                  handleFieldChange(field.name, e.target.value)
                                }
                                className="w-4 h-4 text-accent"
                              />
                              <span className="text-body text-ink">{option}</span>
                            </label>
                          )
                        )}
                      </div>
                    )}

                    {field.type === "text" && (
                      <textarea
                        value={formData[field.name] || ""}
                        onChange={(e) =>
                          handleFieldChange(field.name, e.target.value)
                        }
                        placeholder="Type your response..."
                        rows={field.rows || 4}
                        className="w-full px-4 py-3 border border-hairline rounded-md focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition bg-surface text-body text-ink"
                      />
                    )}

                    {field.type === "scale" && (
                      <div className="space-y-3">
                        <input
                          type="range"
                          min="1"
                          max={field.max || 5}
                          value={formData[field.name] || 1}
                          onChange={(e) =>
                            handleFieldChange(field.name, e.target.value)
                          }
                          className="w-full h-2 bg-hairline rounded-full appearance-none cursor-pointer accent-accent"
                        />
                        <div className="flex justify-between text-small text-slate">
                          <span>Low (1)</span>
                          <span className="text-accent font-semibold">
                            {formData[field.name] || 1}
                          </span>
                          <span>High ({field.max || 5})</span>
                        </div>
                      </div>
                    )}

                    {field.type === "flag" && (
                      <label className="flex items-center gap-3 p-3 rounded-md border border-hairline hover:bg-accent/5 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData[field.name] || false}
                          onChange={(e) =>
                            handleFieldChange(field.name, e.target.checked)
                          }
                          className="w-4 h-4 text-accent rounded"
                        />
                        <span className="text-body text-ink">
                          {field.label || field.title}
                        </span>
                      </label>
                    )}

                    {field.type === "structured" && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-body font-semibold text-ink mb-2">Response</p>
                          <div className="space-y-2">
                            {["Yes", "No"].map((option) => (
                              <label
                                key={option}
                                className="flex items-center gap-3 p-3 rounded-md border border-hairline hover:border-accent hover:bg-accent/5 transition cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={`${field.name}_yn`}
                                  value={option}
                                  checked={
                                    (formData[`${field.name}_yn`] || "No") ===
                                    option
                                  }
                                  onChange={(e) =>
                                    handleFieldChange(
                                      `${field.name}_yn`,
                                      e.target.value
                                    )
                                  }
                                  className="w-4 h-4 text-accent"
                                />
                                <span className="text-body text-ink">{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {formData[`${field.name}_yn`] === "Yes" && (
                          <div>
                            <p className="text-body font-semibold text-ink mb-2">
                              Finding
                            </p>
                            <div className="space-y-2">
                              {(field.classes || classes)?.map((option) => (
                                <label
                                  key={option}
                                  className="flex items-center gap-3 p-3 rounded-md border border-hairline hover:border-accent hover:bg-accent/5 transition cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name={`${field.name}_finding`}
                                    value={option}
                                    checked={
                                      formData[
                                        `${field.name}_finding`
                                      ] === option
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(
                                        `${field.name}_finding`,
                                        e.target.value
                                      )
                                    }
                                    className="w-4 h-4 text-accent"
                                  />
                                  <span className="text-body text-ink">
                                    {option}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-8 pt-8 border-t border-hairline">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-accent-deep hover:bg-accent disabled:bg-muted text-white font-semibold py-3 rounded-md transition flex items-center justify-center gap-2"
              >
                {submitting && (
                  <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                )}
                {showSaved ? "✓ Saved" : submitting ? "Saving..." : "Submit Review"}
              </button>
              {onFlag && (
                <button
                  type="button"
                  onClick={onFlag}
                  disabled={submitting}
                  className="px-6 bg-surface border border-hairline text-ink hover:bg-bg disabled:opacity-50 font-semibold py-3 rounded-md transition"
                >
                  Flag
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="lg:hidden p-4">
        {/* Collapsible Guidelines */}
        {instructions && (
          <button
            onClick={() => setGuidelinesOpen(!guidelinesOpen)}
            className="w-full bg-accent/10 text-accent font-semibold py-3 px-4 rounded-md mb-6 text-left flex items-center justify-between"
          >
            Guidelines
            <span className="text-small">{guidelinesOpen ? "−" : "+"}</span>
          </button>
        )}
        {instructions && guidelinesOpen && (
          <div className="bg-surface border border-hairline rounded-lg p-4 mb-6">
            <p className="text-small text-slate whitespace-pre-wrap">
              {instructions}
            </p>
          </div>
        )}

        {/* Context blocks */}
        {contextBlocks.length > 0 && (
          <div className="bg-surface border border-hairline rounded-lg p-4 mb-6 space-y-4">
            {contextBlocks.map((block, idx) => (
              <div key={idx}>
                <p className="text-caption font-semibold text-muted uppercase mb-1">
                  {block.label}
                </p>
                <p className="text-small text-slate">{block.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Task data */}
        {taskData?.data?.case_id && (
          <div className="mb-4">
            <p className="text-caption font-semibold text-muted uppercase mb-1">
              Case ID
            </p>
            <p className="text-h2 text-ink">{taskData.data.case_id}</p>
          </div>
        )}

        {(taskData?.data?.prompt || taskData?.prompt) && (
          <div className="mb-6">
            <p className="text-h2 text-ink font-semibold leading-relaxed">
              {taskData?.data?.prompt || taskData?.prompt}
            </p>
          </div>
        )}

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="bg-surface border border-hairline rounded-lg p-4">
          <h2 className="text-h2 text-ink mb-4">Your Assessment</h2>

          {error && (
            <div className="bg-error/10 border border-error rounded-lg p-3 mb-4">
              <p className="text-small text-error font-semibold">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {visibleFields.map((field) => (
              <div key={field.name} className="pb-6 border-b border-hairline last:border-b-0 last:pb-0">
                <label className="text-body text-ink font-semibold block mb-2">
                  {field.title}
                  {field.required && <span className="text-error ml-1">*</span>}
                </label>
                {field.hint && (
                  <p className="text-small text-slate mb-3">{field.hint}</p>
                )}

                <div className="space-y-2">
                  {(field.type === "single" || field.type === "from_classes") && (
                    <div className="space-y-2">
                      {(field.type === "single"
                        ? field.options
                        : field.classes || classes
                      )?.map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-3 p-3 rounded-md border border-hairline cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={field.name}
                            value={option}
                            checked={formData[field.name] === option}
                            onChange={(e) =>
                              handleFieldChange(field.name, e.target.value)
                            }
                            className="w-4 h-4 text-accent"
                          />
                          <span className="text-small text-ink">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === "text" && (
                    <textarea
                      value={formData[field.name] || ""}
                      onChange={(e) =>
                        handleFieldChange(field.name, e.target.value)
                      }
                      placeholder="Type your response..."
                      rows={field.rows || 3}
                      className="w-full px-3 py-2 border border-hairline rounded-md focus:border-accent outline-none text-small text-ink"
                    />
                  )}

                  {field.type === "scale" && (
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="1"
                        max={field.max || 5}
                        value={formData[field.name] || 1}
                        onChange={(e) =>
                          handleFieldChange(field.name, e.target.value)
                        }
                        className="w-full h-2 bg-hairline rounded accent-accent"
                      />
                      <div className="flex justify-between text-caption text-slate">
                        <span>Low</span>
                        <span className="text-accent font-semibold">
                          {formData[field.name] || 1}
                        </span>
                        <span>High</span>
                      </div>
                    </div>
                  )}

                  {field.type === "flag" && (
                    <label className="flex items-center gap-3 p-2">
                      <input
                        type="checkbox"
                        checked={formData[field.name] || false}
                        onChange={(e) =>
                          handleFieldChange(field.name, e.target.checked)
                        }
                        className="w-4 h-4 text-accent"
                      />
                      <span className="text-small text-ink">
                        {field.label || field.title}
                      </span>
                    </label>
                  )}

                  {field.type === "structured" && (
                    <div className="space-y-3">
                      <p className="text-small font-semibold text-ink">Response</p>
                      {["Yes", "No"].map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-3 p-2"
                        >
                          <input
                            type="radio"
                            name={`${field.name}_yn`}
                            value={option}
                            checked={
                              (formData[`${field.name}_yn`] || "No") === option
                            }
                            onChange={(e) =>
                              handleFieldChange(
                                `${field.name}_yn`,
                                e.target.value
                              )
                            }
                            className="w-4 h-4 text-accent"
                          />
                          <span className="text-small text-ink">{option}</span>
                        </label>
                      ))}

                      {formData[`${field.name}_yn`] === "Yes" && (
                        <div className="mt-3 ml-4 space-y-2">
                          <p className="text-small font-semibold text-ink">
                            Finding
                          </p>
                          {(field.classes || classes)?.map((option) => (
                            <label
                              key={option}
                              className="flex items-center gap-3 p-2"
                            >
                              <input
                                type="radio"
                                name={`${field.name}_finding`}
                                value={option}
                                checked={
                                  formData[`${field.name}_finding`] === option
                                }
                                onChange={(e) =>
                                  handleFieldChange(
                                    `${field.name}_finding`,
                                    e.target.value
                                  )
                                }
                                className="w-4 h-4 text-accent"
                              />
                              <span className="text-small text-ink">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-6 pt-6 border-t border-hairline">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-accent-deep text-white font-semibold py-3 rounded-md text-small"
            >
              {submitting ? "Saving..." : "Submit"}
            </button>
            {onFlag && (
              <button
                type="button"
                onClick={onFlag}
                disabled={submitting}
                className="px-4 bg-surface border border-hairline text-ink font-semibold py-3 rounded-md text-small"
              >
                Flag
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
