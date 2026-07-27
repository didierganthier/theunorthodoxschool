import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const columns = [
  {
    heading: "Learn",
    links: [
      { href: "/curriculum", label: "Curriculum" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/apply", label: "Start Learning" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/login", label: "Sign In" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

/** Shared site footer with navigation, contact, and GitHub organization link. */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#0a0a0a] px-6 py-14">
      <div className="mx-auto grid max-w-4xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-wider text-white">
            {siteConfig.name}
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">
            {siteConfig.tagline} A self-paced school for builders, creators, and
            unorthodox thinkers.
          </p>
          <a
            href={siteConfig.githubOrgUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-md text-sm text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <span aria-hidden>↗</span> GitHub organization
          </a>
        </div>

        {columns.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-600">
              {col.heading}
            </p>
            <ul className="mt-4 space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-sm text-sm text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mx-auto mt-12 flex max-w-4xl flex-col gap-2 border-t border-white/10 pt-6 text-xs text-gray-700 sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} {siteConfig.name}.</p>
        <a
          href={`mailto:${siteConfig.supportEmail}`}
          className="rounded-sm transition-colors hover:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {siteConfig.supportEmail}
        </a>
      </div>
    </footer>
  );
}
