import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — the brand mark on the dark rounded background. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 96 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M28 52 L48 30 L68 52"
            fill="none"
            stroke="#ededed"
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M31 66 H65"
            fill="none"
            stroke="#ededed"
            strokeWidth={9}
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
