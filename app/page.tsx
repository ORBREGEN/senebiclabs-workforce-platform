import type { Metadata } from "next";
import {
  CalendarClock,
  CheckCircle2,
  Globe,
  Lock,
  Scale,
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

const EXPECTATIONS = [
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

const ELIGIBILITY = [
  "An active clinical licence in good standing",
  "A clinical specialty you practise in",
  "Comfort reading and assessing written cases",
  "A reliable internet connection",
];

const STEPS = [
  {
    title: "Apply",
    body: "Tell us your specialty and your licence. It takes a couple of minutes.",
  },
  {
    title: "Get verified",
    body: "We check your credentials against the register you are licensed with.",
  },
  {
    title: "Calibrate",
    body: "A short set of cases in your specialty, so we can match you to the right work.",
  },
  {
    title: "Review",
    body: "Work through cases from anywhere, on your own schedule, at your own pace.",
  },
  {
    title: "Get paid",
    body: "Paid per reviewed case, including the cases you flag rather than answer.",
  },
];

const FAQ = [
  {
    q: "Can I sign up directly?",
    a: "No. Membership is vetted and by invitation. You apply, we review your credentials, and if there is work that matches your specialty we email you an invitation. That invitation is what creates your account.",
  },
  {
    q: "How does pay work?",
    a: "You are paid per reviewed case. The rate for a body of work is shown before you accept it, so you always know what a case pays before you begin. Cases you flag as unclear are paid the same as cases you complete.",
  },
  {
    q: "How much time does it take?",
    a: "As much or as little as you want. There are no minimum hours and no shifts. Your place is saved between sessions, so you can stop mid-case and come back.",
  },
  {
    q: "Do I need experience with AI?",
    a: "No. The judgment we need is clinical, not technical. If you can assess whether an answer is right for a patient, you can do this work.",
  },
  {
    q: "Which specialties do you work with?",
    a: "A range, and it changes as new work arrives. If your specialty is not needed right now we keep your application on file rather than turning you away.",
  },
  {
    q: "Where do I need to be?",
    a: "Anywhere with a reliable connection. The work is fully remote and you choose your own hours.",
  },
];

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
          <div className="mx-auto max-w-[1100px] px-5 py-20 text-center lg:px-8 lg:py-24">
            <p className="text-label uppercase text-accent">
              For licensed clinicians
            </p>
            <h1
              className="mx-auto mt-4 max-w-[720px] text-[38px] leading-[1.12] text-ink sm:text-[52px]"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
            >
              Get paid to apply your clinical knowledge
            </h1>
            <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-relaxed text-muted">
              Review what medical AI says in your specialty, confirm it or
              correct it, and flag what it misses. Remote work, on your own
              schedule, paid per case.
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

        {/* What you can expect */}
        <section className="border-b border-hairline bg-canvas">
          <div className="mx-auto max-w-[1100px] px-5 py-16 lg:px-8">
            <div className="text-center">
              <h2 className="text-[26px] font-semibold leading-tight text-ink">
                What you can expect
              </h2>
              <p className="mx-auto mt-3 max-w-[500px] text-body text-muted">
                Paid work that fits around clinical practice, and that changes
                what these systems tell people.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {EXPECTATIONS.map((item) => (
                <Card key={item.title} className="h-full p-5">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent"
                  >
                    <item.icon size={17} />
                  </span>
                  <h3 className="mt-4 text-section text-ink">{item.title}</h3>
                  <p className="mt-1.5 text-body text-muted">{item.body}</p>
                </Card>
              ))}
            </div>

            {/* Eligibility sits with the offer, the way a fellowship page states
                who may apply rather than giving it a section of its own. */}
            <div className="mx-auto mt-10 max-w-[720px] rounded-card border border-hairline bg-surface p-6 text-center">
              <h3 className="text-section text-ink">Who can apply</h3>
              <p className="mx-auto mt-2 max-w-[440px] text-body text-muted">
                The bar is clinical experience. There is nothing to buy and no
                training to complete first.
              </p>
              <ul className="mx-auto mt-5 grid max-w-[600px] grid-cols-1 gap-2.5 text-left sm:grid-cols-2">
                {ELIGIBILITY.map((r) => (
                  <li key={r} className="flex items-start gap-2.5">
                    <CheckCircle2
                      size={16}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-accent"
                    />
                    <span className="text-body text-muted">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Renders only once real quotes exist. */}
        <Testimonials />

        {/* How it works */}
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-[1100px] px-5 py-16 lg:px-8">
            <h2 className="text-center text-[26px] font-semibold leading-tight text-ink">
              How it works
            </h2>

            <ol className="mx-auto mt-10 max-w-[760px] divide-y divide-hairline border-y border-hairline">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="flex flex-col gap-1.5 py-5 sm:flex-row sm:items-baseline sm:gap-6"
                >
                  <span
                    aria-hidden="true"
                    className="tnum shrink-0 text-[15px] font-semibold text-accent sm:w-10"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="sm:flex-1">
                    <h3 className="text-section text-ink">{step.title}</h3>
                    <p className="mt-1 text-body text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10">
              <ApplyActions />
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="border-b border-hairline bg-canvas">
          <div className="mx-auto max-w-[1100px] px-5 py-16 lg:px-8">
            <h2 className="text-center text-[26px] font-semibold leading-tight text-ink">
              FAQs
            </h2>

            <div className="mx-auto mt-10 max-w-[720px] space-y-2.5">
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

        {/* Closing band */}
        <section>
          <div className="mx-auto max-w-[1100px] px-5 py-20 text-center lg:px-8">
            <h2
              className="mx-auto max-w-[560px] text-[30px] leading-tight text-ink"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
            >
              Put your clinical knowledge to paid work
            </h2>
            <p className="mx-auto mt-3 max-w-[460px] text-body text-muted">
              Apply with your specialty and licence. We review every application.
            </p>
            <div className="mt-8">
              <ApplyActions />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline bg-canvas">
        <div className="mx-auto max-w-[1100px] px-5 py-8 text-center text-[13px] text-muted lg:px-8">
          <p className="font-medium text-ink">Senebiclabs</p>
          <p className="mt-1">Clinical review platform for licensed clinicians</p>
        </div>
      </footer>
    </div>
  );
}
