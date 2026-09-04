import type { Metadata } from "next";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Globe,
  Lock,
  ScrollText,
  Scale,
  Stethoscope,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ApplyActions } from "@/components/landing/ApplyDialog";

export const metadata: Metadata = {
  title: "Senebiclabs for clinicians",
  description:
    "Licensed clinicians review medical AI against clinical guidelines. Remote, flexible, paid expert review. Membership is vetted and by invitation.",
};

/* ── content ─────────────────────────────────────────────────────── */

const STEPS = [
  {
    icon: ScrollText,
    title: "Apply",
    body: "Tell us your specialty and your licence. It takes a couple of minutes.",
  },
  {
    icon: ClipboardCheck,
    title: "Get vetted",
    body: "We check your credentials and ask you to complete a short calibration in your specialty.",
  },
  {
    icon: FileSearch,
    title: "Review in your specialty",
    body: "Work through cases from anywhere, on your own schedule, in the areas you actually practise.",
  },
  {
    icon: Wallet,
    title: "Get paid",
    body: "You are paid per reviewed task. The rate is shown before you accept any work.",
  },
];

const BENEFITS = [
  {
    icon: Stethoscope,
    title: "Your judgment is the standard",
    body: "Medical AI is measured against what experienced clinicians say is correct. That reference has to come from someone, and it comes from you.",
  },
  {
    icon: CalendarClock,
    title: "Remote and flexible",
    body: "There are no shifts and no minimum hours. Pick up cases when you have time and stop when you do not.",
  },
  {
    icon: Wallet,
    title: "Paid for your expertise",
    body: "Work is paid per reviewed task, at professional rates, with the rate visible before you take anything on.",
  },
  {
    icon: Scale,
    title: "Real clinical rigour",
    body: "Several clinicians review each case and disagreements are adjudicated. This is considered work, not volume piecework.",
  },
  {
    icon: Lock,
    title: "Confidential by design",
    body: "Case material stays inside the platform. You see only the pools you have been given, and nothing leaves with you.",
  },
  {
    icon: Globe,
    title: "Work that carries",
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
    a: "You are paid per reviewed task. The rate for a body of work is shown before you accept it, so you always know what a case pays before you begin. Reviews that you flag as unclear are paid the same as reviews you complete.",
  },
  {
    q: "How much time does it take?",
    a: "As much or as little as you want. There are no minimum hours and no shifts. Your place is saved between sessions, so you can stop mid-case and come back.",
  },
  {
    q: "Which specialties do you work with?",
    a: "A range, and it changes as new work arrives. If your specialty is not needed right now we will keep your application on file rather than turning you away.",
  },
  {
    q: "Where do I need to be?",
    a: "Anywhere with a reliable connection. The work is fully remote and you choose your own hours.",
  },
  {
    q: "What does a review actually involve?",
    a: "You read a case and the answer a model gave, judge it against the guidelines you already work to, confirm or correct it, and flag anything clinically unsafe. The rubric sits beside the case while you work.",
  },
];

/* ── page ────────────────────────────────────────────────────────── */

export default function Landing() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Top bar */}
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-5 lg:px-8">
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Senebiclabs
          </span>
          <a
            href="/login"
            className="focusable rounded-btn px-2 py-1 text-body font-medium text-ink transition-colors hover:text-accent"
          >
            Sign in
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b border-hairline bg-surface">
          <div className="mx-auto max-w-[1100px] px-5 py-20 text-center lg:px-8 lg:py-28">
            <p className="text-label uppercase text-accent">
              For licensed clinicians
            </p>
            <h1
              className="mx-auto mt-4 max-w-[760px] font-serif text-[34px] leading-[1.2] text-ink sm:text-[44px]"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Medical AI is measured against clinical judgment. Yours.
            </h1>
            <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-relaxed text-muted">
              Review what medical AI says in your specialty, confirm it or correct
              it, and flag what it misses. Remote, on your schedule, paid for your
              expertise.
            </p>

            <div className="mt-8">
              <ApplyActions />
            </div>

            <p className="mt-5 text-[13px] text-muted">
              Membership is vetted. Apply, and we send an invitation to the
              clinicians we can offer work to.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-[1100px] px-5 py-20 lg:px-8">
          <div className="text-center">
            <h2 className="text-[26px] font-semibold leading-tight text-ink">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-[520px] text-body text-muted">
              Four steps from applying to reviewing your first case.
            </p>
          </div>

          <ol className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <Card className="h-full p-5">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"
                    >
                      <step.icon size={17} />
                    </span>
                    <span className="tnum text-label uppercase text-muted">
                      Step {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-section text-ink">{step.title}</h3>
                  <p className="mt-1.5 text-body text-muted">{step.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        {/* Why join */}
        <section className="border-y border-hairline bg-surface">
          <div className="mx-auto max-w-[1100px] px-5 py-20 lg:px-8">
            <div className="text-center">
              <h2 className="text-[26px] font-semibold leading-tight text-ink">
                Why clinicians do this work
              </h2>
              <p className="mx-auto mt-3 max-w-[520px] text-body text-muted">
                It pays, it fits around clinical practice, and it changes what
                these systems tell people.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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

        {/* What the work looks like */}
        <section className="mx-auto max-w-[1100px] px-5 py-20 lg:px-8">
          <div className="text-center">
            <h2 className="text-[26px] font-semibold leading-tight text-ink">
              What a review looks like
            </h2>
            <p className="mx-auto mt-3 max-w-[540px] text-body text-muted">
              One case at a time, with the rubric beside it. Nothing is timed and
              nothing forces a guess.
            </p>
          </div>

          <Card className="mx-auto mt-12 max-w-[820px] overflow-hidden p-0">
            <div className="border-b border-hairline px-5 py-3">
              <p className="text-label uppercase text-muted">
                Illustration of a single case
              </p>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <p className="text-label uppercase text-muted">
                  Clinical scenario
                </p>
                <p className="mt-1.5 text-body leading-relaxed text-ink">
                  A 34 year old presents with three days of productive cough and a
                  low grade fever. No chest pain, no breathlessness at rest.
                </p>
              </div>

              <div className="rounded-card border-l-2 border-l-accent bg-canvas px-4 py-3">
                <p className="text-label uppercase text-muted">Model output</p>
                <p className="mt-1.5 text-body leading-relaxed text-ink">
                  Likely a viral upper respiratory infection. Supportive care and
                  review if symptoms persist beyond ten days.
                </p>
              </div>

              <div className="border-t border-hairline pt-5">
                <p className="text-label uppercase text-muted">Your assessment</p>
                <ul className="mt-3 space-y-2.5">
                  {[
                    "Is this answer accurate against the guidelines you work to",
                    "Correct the wording where it is wrong, in your own words",
                    "Flag anything clinically unsafe that the answer missed",
                    "Say how confident you are, and flag the case if it is outside your area",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={16}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-accent"
                      />
                      <span className="text-body text-muted">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="border-t border-hairline bg-canvas px-5 py-3 text-[13px] text-muted">
              Several clinicians see each case. Where you disagree, the case goes
              to adjudication rather than to a majority vote.
            </p>
          </Card>
        </section>

        {/* Requirements */}
        <section className="border-y border-hairline bg-surface">
          <div className="mx-auto max-w-[1100px] px-5 py-20 lg:px-8">
            <div className="mx-auto max-w-[620px] text-center">
              <h2 className="text-[26px] font-semibold leading-tight text-ink">
                What we ask for
              </h2>
              <p className="mt-3 text-body text-muted">
                The bar is clinical experience. There is nothing to buy and no
                training to complete first.
              </p>

              <ul className="mt-10 space-y-3 text-left">
                {REQUIREMENTS.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-3 rounded-card border border-hairline bg-canvas px-4 py-3"
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
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-[1100px] px-5 py-20 lg:px-8">
          <div className="text-center">
            <h2 className="text-[26px] font-semibold leading-tight text-ink">
              Questions clinicians ask
            </h2>
          </div>

          <div className="mx-auto mt-12 max-w-[720px] space-y-3">
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
        </section>

        {/* Final CTA */}
        <section className="border-t border-hairline bg-surface">
          <div className="mx-auto max-w-[1100px] px-5 py-20 text-center lg:px-8">
            <h2 className="mx-auto max-w-[560px] text-[26px] font-semibold leading-tight text-ink">
              Put your clinical judgment behind the answers people receive
            </h2>
            <p className="mx-auto mt-3 max-w-[500px] text-body text-muted">
              Apply with your specialty and licence. We review every application.
            </p>
            <div className="mt-8">
              <ApplyActions />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-3 px-5 py-8 text-[13px] text-muted sm:flex-row lg:px-8">
          <span>Senebiclabs</span>
          <span>Clinical review platform for licensed clinicians</span>
        </div>
      </footer>
    </div>
  );
}
