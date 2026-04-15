import Link from "next/link";

/**
 * Root-level 404 — rendered when no locale is resolved yet.
 * Keeps it framework-agnostic (no next-intl, no session).
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#060f1e",
          color: "#fff",
          fontFamily: "Inter, system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          {/* Decorative code */}
          <p
            style={{
              fontSize: "6rem",
              fontWeight: 800,
              lineHeight: 1,
              background: "linear-gradient(135deg, #C9A227, #e8c547)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
            }}
          >
            404
          </p>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "#fff",
              marginTop: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            Page not found
          </h1>
          <p style={{ color: "#6e7d93", fontSize: "0.9rem", marginBottom: "2rem" }}>
            The page you are looking for does not exist or has been moved.
          </p>

          <Link
            href="/en"
            style={{
              display: "inline-block",
              padding: "0.65rem 1.75rem",
              background: "linear-gradient(135deg, #C9A227, #e8c547)",
              color: "#060f1e",
              fontWeight: 600,
              borderRadius: "0.75rem",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            Back to home
          </Link>
        </div>
      </body>
    </html>
  );
}
