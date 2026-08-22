"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/Button";

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
}

interface ContextBlock {
  label: string;
  content?: string;
}

interface EvalConfig {
  instructions?: string;
  schema: {
    fields: Record<string, Omit<Field, "name">>;
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
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const fieldsDict = evalConfig?.schema?.fields || {};
  const fields: Field[] = Object.entries(fieldsDict).map(([name, config]) => ({
    name,
    ...config,
  }));

  const classes = evalConfig?.schema?.classes || [];
  const instructions = evalConfig?.instructions;
  const contextBlocks = evalConfig?.schema?.context || [];

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

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const formatAnnotation = () => {
    const result = [];

    for (const field of fields) {
      const value = formData[field.name];

      switch (field.type) {
        case "single":
        case "from_classes": {
          result.push({
            from_name: field.name,
            to_name: "image",
            type: "choices",
            value: { choices: [value || ""] },
          });
          break;
        }
        case "text": {
          result.push({
            from_name: field.name,
            to_name: "image",
            type: "textarea",
            value: { text: [value || ""] },
          });
          break;
        }
        case "scale": {
          result.push({
            from_name: field.name,
            to_name: "image",
            type: "rating",
            value: { rating: parseInt(value) || 1 },
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
            value: { choices: [yesNo] },
          });
          result.push({
            from_name: `${field.name}_finding`,
            to_name: "image",
            type: "choices",
            value: { choices: finding ? [finding] : [] },
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

    for (const field of fields) {
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

  const renderField = (field: Field) => (
    <div key={field.name} className="pt-8 first:pt-0">
      <label className="text-h2 font-serif text-ink block mb-2">
        {field.title}
        {field.required && <span className="text-error ml-1">*</span>}
      </label>
      {field.hint && <p className="text-small text-muted mb-4">{field.hint}</p>}

      <div className="mt-4 space-y-3">
        {(field.type === "single" || field.type === "from_classes") && (
          <div className="space-y-2">
            {(field.type === "single" ? field.options : field.classes || classes)?.map(
              (option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 p-3 rounded-md border border-hairline hover:border-teal hover:bg-teal-soft transition-all duration-160 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={option}
                    checked={formData[field.name] === option}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="w-4 h-4 text-teal"
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
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder="Type your response..."
            rows={field.rows || 4}
            className="w-full px-4 py-3 border border-hairline rounded-md bg-surface text-body text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal transition-all duration-160"
          />
        )}

        {field.type === "scale" && (
          <div className="space-y-4">
            <input
              type="range"
              min="1"
              max={field.max || 5}
              value={formData[field.name] || 1}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="w-full h-2 bg-hairline rounded-full appearance-none cursor-pointer accent-teal"
            />
            <div className="flex justify-between text-small text-slate">
              <span>Low (1)</span>
              <span className="text-teal font-semibold">
                {formData[field.name] || 1}
              </span>
              <span>High ({field.max || 5})</span>
            </div>
          </div>
        )}

        {field.type === "structured" && (
          <div className="space-y-4">
            <p className="text-body font-semibold text-ink">Response</p>
            <div className="space-y-2">
              {["Yes", "No"].map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 p-3 rounded-md border border-hairline hover:border-teal hover:bg-teal-soft transition-all duration-160 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`${field.name}_yn`}
                    value={option}
                    checked={(formData[`${field.name}_yn`] || "No") === option}
                    onChange={(e) =>
                      handleFieldChange(`${field.name}_yn`, e.target.value)
                    }
                    className="w-4 h-4 text-teal"
                  />
                  <span className="text-body text-ink">{option}</span>
                </label>
              ))}
            </div>

            {formData[`${field.name}_yn`] === "Yes" && (
              <div className="pl-4 space-y-2 mt-4 pt-4 border-l-2 border-teal-soft">
                <p className="text-body font-semibold text-ink">Finding</p>
                {(field.classes || classes)?.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-3 p-3 rounded-md border border-hairline hover:border-teal hover:bg-teal-soft transition-all duration-160 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`${field.name}_finding`}
                      value={option}
                      checked={formData[`${field.name}_finding`] === option}
                      onChange={(e) =>
                        handleFieldChange(`${field.name}_finding`, e.target.value)
                      }
                      className="w-4 h-4 text-teal"
                    />
                    <span className="text-body text-ink">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const contextSection = contextBlocks.length > 0 && (
    <div className="bg-surface-soft rounded-lg border border-hairline p-6 lg:p-8">
      <div className="space-y-6 lg:space-y-8">
        {contextBlocks.map((block, idx) => (
          <div key={idx}>
            <p className="text-caption font-semibold text-teal uppercase tracking-wide mb-2 lg:mb-3">
              {block.label}
            </p>
            <p className="text-body text-slate leading-relaxed">{block.content}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const taskDataSection = (
    <>
      {taskData?.data?.case_id && (
        <div>
          <p className="text-caption font-semibold text-teal uppercase tracking-wide mb-2">
            Case ID
          </p>
          <p className="text-h1 font-serif text-ink">{taskData.data.case_id}</p>
        </div>
      )}
      {(taskData?.data?.prompt || taskData?.prompt) && (
        <div>
          <p className="text-h1 font-serif text-ink leading-relaxed">
            {taskData?.data?.prompt || taskData?.prompt}
          </p>
        </div>
      )}
    </>
  );

  const formSection = (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-surface border border-hairline rounded-lg p-6 lg:p-8 space-y-8"
    >
      <div>
        <h2 className="text-h1 font-serif text-ink mb-2">Your Assessment</h2>
        <p className="text-body text-slate">
          Answer the following {fields.length}{" "}
          {fields.length === 1 ? "question" : "questions"}
        </p>
      </div>

      {error && (
        <div className="bg-error bg-opacity-10 border border-error rounded-lg p-4">
          <p className="text-body font-semibold text-error">⚠️ {error}</p>
        </div>
      )}

      <div className="space-y-8 divide-y divide-hairline">
        {fields.map((field) => renderField(field))}
      </div>

      <div className="flex gap-4 pt-8 border-t border-hairline">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          className="flex-1"
        >
          Submit Review
        </Button>
        {onFlag && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onFlag}
            disabled={submitting}
          >
            Flag
          </Button>
        )}
      </div>
    </form>
  );

  return (
    <>
      {/* Desktop: two-column grid — Guidelines sidebar + Main content */}
      <div className="hidden lg:grid lg:grid-cols-[340px_1fr] gap-8 items-start">
        {instructions && (
          <div className="sticky top-24">
            <div className="bg-teal-soft rounded-lg p-6 border border-hairline">
              <h3 className="text-h2 font-serif text-ink mb-4">Guidelines</h3>
              <p className="text-body text-slate leading-relaxed whitespace-pre-wrap">
                {instructions}
              </p>
            </div>
          </div>
        )}
        <div className="space-y-8">
          {contextSection}
          {taskDataSection}
          {formSection}
        </div>
      </div>

      {/* Mobile/tablet: single column, Guidelines as top accordion */}
      <div className="lg:hidden space-y-6">
        {instructions && (
          <div>
            <button
              onClick={() => setGuidelinesOpen(!guidelinesOpen)}
              className="w-full bg-teal-soft text-teal-deep font-semibold py-3 px-4 rounded-md text-left flex items-center justify-between"
            >
              Guidelines
              <span className="text-small">{guidelinesOpen ? "−" : "+"}</span>
            </button>
            {guidelinesOpen && (
              <div className="bg-teal-soft rounded-b-md px-4 pb-4 -mt-1">
                <p className="text-small text-slate whitespace-pre-wrap leading-relaxed">
                  {instructions}
                </p>
              </div>
            )}
          </div>
        )}
        {contextSection}
        {taskDataSection}
        {formSection}
      </div>
    </>
  );
}
