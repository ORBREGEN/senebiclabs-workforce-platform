import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Globe,
  Lock,
  Scale,
  ScrollText,
  Stethoscope,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ApplyActions } from "@/components/landing/ApplyDialog";
import { Testimonials } from "@/components/landing/Testimonials";

export const metadata: Metadata = {
  title: "Senebiclabs for clinicians",
  description:
    "Paid remote work for licensed clinicians. Apply your clinical knowledge to reviewing medical AI, on your own schedule. Membership is vetted and by invitation.",
};

const STEPS = [
  {
    icon: ScrollText,
    title: "Apply",
    body: "Tell us your specialty and your licence. It takes a couple of minutes.",
  },
  {
    icon: ClipboardCheck,
    title: "Get vetted",
    body: "We check your credentials and ask for a short calibration in your specialty.",
  },
  {
    icon: FileSearch,
    title: "Review",
    body: "Work through cases from anywhere, on your own schedule, in the areas you practise.",
  },
  {
    icon: Wallet,
    title: "Get paid",
    body: "Paid per reviewed task, at a rate shown before you accept any work.",
  },
];

const BENEFITS = [
  {
    icon: Wallet,
    title: "Paid for what you already know",
    body: "Paid per reviewed case, at professional rates, with the rate visible before you take anything on.",
  },
  {
    icon: CalendarClock,
    title: "Remote and flexible",
    body: "No shifts and no minimum hours. Pick up cases when you have time and stop when you do not.",
  },
  {
    icon: Stethoscope,
    title: "Work inside your specialty",
    body: "You review in the areas you actually practise, against the guidelines you already work to.",
  },
  {
    icon: Scale,
    title: "Real clinical rigour",
    body: "Several clinicians see each case and disagreements are adjudicated. Considered work, not volume piecework.",
  },
  {
    icon: Lock,
    title: "Confidential by design",
    body: "Case material stays inside the platform. You see only the pools you have been given.",
  },
  {
    icon: Globe,
    title: "Your judgment is the standard",
    body: "A correction you make today shapes how a model answers the same question for everyone who asks it next.",
  },
];

const REQUIREMENTS = [
  "An active clinical licence in good standing",
  "A clinical specialty you practise in",
  "Comfort reading and assessing written cases",
  "A reliable internet connection",
];

const FAQ = [
  {
    q: "Can I sign up directly?",
    a: "No. Membership is vetted and by invitation. You apply, we review your credentials, and if there is work that matches your specialty we email you an invitation. That invitation is what creates your account.",
  },
  {
    q: "How does pay work?",
    a: "You are paid per reviewed task. The rate for a body of work is shown before you accept it, so you always know what a case pays before you begin. Reviews you flag as unclear are paid the same as reviews you complete.",
  },
  {
    q: "How much time does it take?",
    a: "As much or as little as you want. There are no minimum hours and no shifts. Your place is saved between sessions, so you can stop mid-case and come back.",
  },
  {
    q: "Which specialties do you work with?",
    a: "A range, and it changes as new work arrives. If your specialty is not needed right now we keep your application on file rather than turning you away.",
  },
  {
    q: "Where do I need to be?",
    a: "Anywhere with a reliable connection. The work is fully remote and you choose your own hours.",
  },
  {
    q: "What does a review involve?",
    a: "You read a case and the answer a model gave, judge it against the guidelines you already work to, confirm or correct it, and flag anything clinically unsafe. The rubric sits beside the case while you work.",
  },
];

/** The hero's visual: the shape of the work, without inventing a case. */
function FlowVisual() {
  const stages = [
    { label: "A case arrives", tone: "muted" },
    { label: "You judge it against guidelines", tone: "accent" },
    { label: "Disagreements are adjudicated", tone: "muted" },
    { label: "The answer becomes the standard", tone: "muted" },
  ];

  return (
    <div
      aria-hidden="true"
      className="rounded-card border border-hairline bg-surface p-5 shadow-[0_1px_3px_rgba(16,49,46,0.06)]"
    >
      <p className="text-label uppercase text-muted">How a case moves</p>
      <ol className="mt-4 space-y-2.5">
        {stages.map((s, i) => (
          <li
            key={s.label}
            className={`flex items-center gap-3 rounded-card border px-4 py-3 ${
              s.tone === "accent"
                ? "border-accent bg-accent-soft"
                : "border-hairline bg-canvas"
            }`}
          >
            <span
              className={`tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                s.tone === "accent"
                  ? "bg-accent text-white"
                  : "bg-surface text-muted"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-body ${
                s.tone === "accent" ? "font-medium text-ink" : "text-muted"
              }`}
            >
              {s.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-hairline bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-5 lg:px-8">
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Senebiclabs
          </span>
          <a
            href="/login"
            className="focusable rounded-btn px-2.5 py-1.5 text-body font-medium text-ink transition-colors hover:text-accent"
          >
            Sign in
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-[1100px] px-5 py-16 text-center lg:px-8 lg:py-20">
            <p className="text-label uppercase text-accent">
              For licensed clinicians
            </p>
            <h1
              className="mx-auto mt-3 max-w-[720px] text-[36px] leading-[1.15] text-ink sm:text-[46px]"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
            >
              Get paid to apply your clinical knowledge.
            </h1>
            <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-relaxed text-muted">
              Review what medical AI says in your specialty, confirm it or
              correct it, and flag what it misses. Remote work, on your own
              schedule, paid per case. Your judgment is what these systems are
              measured against.
            </p>

            <div className="mt-7">
              <ApplyActions />
            </div>

            <p className="mt-4 text-[13px] text-muted">
              Membership is vetted. Apply, and we send an invitation to the
              clinicians we can offer work to.
            </p>

            <div className="mx-auto mt-12 max-w-[560px] text-left">
              <FlowVisual />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-hairline bg-canvas">
          <div className="mx-auto max-w-[1100px] px-5 py-16 lg:px-8">
            <div className="text-center">
              <h2 className="text-[26px] font-semibold leading-tight text-ink">
                How it works
              </h2>
              <p className="mx-auto mt-3 max-w-[460px] text-body text-muted">
                Four steps from applying to your first case.
              </p>
            </div>

            <ol className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li key={step.title}>
                  <Card className="h-full p-5">
                    <div className="flex items-center justify-between">
                      <span
                        aria-hidden="true"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent"
                      >
                        <step.icon size={17} />
                      </span>
                      <span className="tnum text-[26px] font-semibold leading-none text-hairline">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 text-section text-ink">{step.title}</h3>
                    <p className="mt-1.5 text-body text-muted">{step.body}</p>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Why join */}
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-[1100px] px-5 py-16 lg:px-8">
            <div className="text-center">
              <h2 className="text-[26px] font-semibold leading-tight text-ink">
                Why clinicians do this work
              </h2>
              <p className="mx-auto mt-3 max-w-[500px] text-body text-muted">
                Paid work that fits around clinical practice, and that changes
                what these systems tell people.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((b) => (
                <Card key={b.title} className="h-full p-5">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent"
                  >
                    <b.icon size={17} />
                  </span>
                  <h3 className="mt-4 text-section text-ink">{b.title}</h3>
                  <p className="mt-1.5 text-body text-muted">{b.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="border-b border-hairline bg-canvas">
          <div className="mx-auto max-w-[1100px] px-5 py-16 lg:px-8">
            <div className="text-center">
              <h2 className="text-[26px] font-semibold leading-tight text-ink">
                What we ask for
              </h2>
              <p className="mx-auto mt-3 max-w-[440px] text-body text-muted">
                The bar is clinical experience. There is nothing to buy and no
                training to complete first.
              </p>
            </div>

            <ul className="mx-auto mt-8 max-w-[560px] space-y-2.5">
              {REQUIREMENTS.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 rounded-card border border-hairline bg-surface px-4 py-3.5"
                >
                  <CheckCircle2
                    size={17}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-accent"
                  />
                  <span className="text-body text-ink">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Renders only once real quotes exist. */}
        <Testimonials />

        {/* FAQ */}
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-[1100px] px-5 py-16 lg:px-8">
            <h2 className="text-center text-[26px] font-semibold leading-tight text-ink">
              Questions clinicians ask
            </h2>

            <div className="mx-auto mt-8 max-w-[720px] space-y-2.5">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-card border border-hairline bg-surface"
                >
                  <summary className="focusable cursor-pointer list-none px-5 py-4 text-body font-medium text-ink marker:hidden">
                    <span className="flex items-center justify-between gap-4">
                      {item.q}
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-muted transition-transform duration-150 group-open:rotate-45"
                      >
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="border-t border-hairline px-5 py-4 text-body leading-relaxed text-muted">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-canvas">
          <div className="mx-auto max-w-[1100px] px-5 py-16 text-center lg:px-8">
            <h2 className="mx-auto max-w-[540px] text-[26px] font-semibold leading-tight text-ink">
              Put your clinical knowledge to paid work
            </h2>
            <p className="mx-auto mt-3 max-w-[460px] text-body text-muted">
              Apply with your specialty and licence. We review every application.
            </p>
            <div className="mt-7">
              <ApplyActions />
            </div>
            <p className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-muted">
              Already a member
              <a
                href="/login"
                className="focusable inline-flex items-center gap-1 rounded-btn font-medium text-accent underline-offset-2 hover:underline"
              >
                Sign in
                <ArrowRight size={13} aria-hidden="true" />
              </a>
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto max-w-[1100px] px-5 py-8 text-center text-[13px] text-muted lg:px-8">
          <p className="font-medium text-ink">Senebiclabs</p>
          <p className="mt-1">Clinical review platform for licensed clinicians</p>
        </div>
      </footer>
    </div>
  );
}
