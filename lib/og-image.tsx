import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";
import { logoDataUri } from "@/lib/logo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Shared Open Graph / Twitter preview image.
 *
 * Rendered at build/request time by next/og so shared links (WhatsApp, X,
 * iMessage, Slack, etc.) show a branded 1200×630 card instead of a bare icon.
 */
export function renderPreviewImage(): ImageResponse {
  const hostname = siteConfig.url.replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          color: "#ededed",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoDataUri} width={104} height={104} alt="" />
          <div
            style={{
              display: "flex",
              fontSize: 30,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "#8a8a8a",
            }}
          >
            The Unorthodox School
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.05,
              color: "#ffffff",
            }}
          >
            <span style={{ display: "flex" }}>Learn differently.</span>
            <span style={{ display: "flex" }}>Build independently.</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              color: "#9a9a9a",
              maxWidth: 940,
            }}
          >
            A self-paced school where you learn by building and prove it with
            real projects.
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 26,
            color: "#6a6a6a",
          }}
        >
          <span style={{ display: "flex" }}>{hostname}</span>
          <span style={{ display: "flex" }}>Self-paced · Project-based</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
