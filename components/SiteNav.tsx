import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const links = [
  { href: "/", label: "Home" },
  { href: "/curriculum", label: "Curriculum" },
  { href: "/how-it-works", label: "How It Works" },
];

const enrollmentCta: Record<string, string> = {
  open: "Start Learning",
  waitlist: "Join Waitlist",
  closed: "Apply",
};

/**
 * Shared public site navigation. Preserves the original fixed, translucent,
 * dark styling. Includes a skip link and keyboard-accessible focus states.
 */
export default function SiteNav() {
  const cta = enrollmentCta[siteConfig.enrollmentStatus] ?? "Start Learning";

  return (
    <header>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
      >
        Skip to content
      </a>
      <nav
        aria-label="Primary"
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0a0a0a]/90 px-6 py-4 backdrop-blur-md"
      >
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-wider text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-sm"
        >
          {siteConfig.name}
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <ul className="hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Sign In
          </Link>

          <Link
            href="/apply"
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            {cta}
          </Link>
        </div>
      </nav>
    </header>
  );
}
