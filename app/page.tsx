import Link from "next/link";

const weeks = [
  {
    week: "Week 1",
    title: "The Shift",
    desc: "Understand the modern world, AI, and what opportunities actually exist today.",
  },
  {
    week: "Week 2",
    title: "AI as a Tool",
    desc: "Learn to use AI to learn, write, research, and build — not just as a gimmick.",
  },
  {
    week: "Week 3",
    title: "Build Something",
    desc: "Create your first project: a website, a tool, or a digital product.",
  },
  {
    week: "Week 4",
    title: "Opportunities",
    desc: "Freelancing, online presence, portfolio. Turn skills into income.",
  },
  {
    week: "Week 5",
    title: "Showcase",
    desc: "Present your project, receive feedback, and define your next move.",
  },
];

export default function Home() {
  return (
    <main className="bg-[#0a0a0a] text-[#ededed] min-h-screen font-sans">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md">
        <span className="text-sm font-semibold tracking-wider uppercase text-white">
          The Unorthodox School
        </span>
        <Link
          href="/apply"
          className="text-sm px-4 py-2 bg-white text-black font-semibold rounded-md hover:bg-gray-200 transition-colors"
        >
          Apply Now
        </Link>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 pt-24 pb-16">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-6">
          Cohort 1 — Starts June 27, 2027
        </p>
        <h1 className="text-5xl sm:text-7xl font-bold leading-tight tracking-tight text-white max-w-4xl">
          Learn differently.
          <br />
          <span className="text-gray-500">Build differently.</span>
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
          A 5-week program in AI &amp; digital skills for a new generation of
          Haitian builders, creators, and unorthodox thinkers.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/apply"
            className="px-8 py-4 bg-white text-black font-semibold rounded-md hover:bg-gray-200 transition-colors text-base"
          >
            Apply — 2,500 HTG
          </Link>
          <a
            href="#program"
            className="px-8 py-4 border border-white/20 text-white font-semibold rounded-md hover:border-white/50 transition-colors text-base"
          >
            See the program
          </a>
        </div>
        <p className="mt-6 text-xs text-gray-600">
          Limited spots. Applications close before June 27.
        </p>
      </section>

      {/* MANIFESTO STRIP */}
      <section className="border-y border-white/10 py-16 px-6 bg-[#111111]">
        <div className="max-w-3xl mx-auto text-center space-y-4 text-gray-400 text-lg leading-relaxed">
          <p>Haiti does not lack intelligence.</p>
          <p>Haiti does not lack creativity.</p>
          <p>Haiti does not lack ambition.</p>
          <p className="text-white font-medium pt-4">
            What Haiti lacks are systems that recognize unconventional potential.
          </p>
        </div>
      </section>

      {/* WHO IS IT FOR */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">
            Who it&apos;s for
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12">
            You don&apos;t need a degree.
            <br />
            You need a decision.
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Students who feel school isn't enough",
              "School dropouts who kept learning anyway",
              "Self-taught learners with no clear direction",
              "Creatives, freelancers, future builders",
              "Beginners curious about tech & AI",
              "Anyone ready to learn by doing",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 p-4 border border-white/10 rounded-lg bg-[#111111]"
              >
                <span className="text-white mt-0.5">→</span>
                <span className="text-gray-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAM */}
      <section id="program" className="py-24 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">
            The program
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12">
            5 weeks. Real skills.
            <br />
            One project you built yourself.
          </h2>
          <div className="space-y-3">
            {weeks.map((w, i) => (
              <div
                key={i}
                className="flex gap-6 p-5 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
              >
                <div className="w-16 shrink-0">
                  <span className="text-xs text-gray-600 uppercase tracking-wider">
                    {w.week}
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold mb-1">{w.title}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {w.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMAT */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">
            Format
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12">
            Practical. Online. Community-driven.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Live sessions", value: "1 per week\n2 hours each" },
              { label: "Assignments", value: "Weekly practical\nchallenges" },
              { label: "Community", value: "Private WhatsApp\ngroup" },
              { label: "What you leave with", value: "A real project\nyou built" },
            ].map((item) => (
              <div
                key={item.label}
                className="p-5 border border-white/10 rounded-lg bg-[#111111]"
              >
                <p className="text-xs uppercase tracking-wider text-gray-600 mb-2">
                  {item.label}
                </p>
                <p className="text-white text-sm leading-relaxed whitespace-pre-line">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[#111111] border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            The future belongs to builders.
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Cohort 1 starts June 27, 2027. Limited spots.
            <br />
            Price: 2,500 HTG
          </p>
          <Link
            href="/apply"
            className="inline-block px-10 py-5 bg-white text-black font-semibold rounded-md hover:bg-gray-200 transition-colors text-lg"
          >
            Apply Now
          </Link>
          <p className="mt-4 text-xs text-gray-600">
            Applications take 2 minutes. Not everyone is accepted.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 border-t border-white/10 text-center text-xs text-gray-700">
        © 2027 The Unorthodox School. Built in Haiti.
      </footer>
    </main>
  );
}
