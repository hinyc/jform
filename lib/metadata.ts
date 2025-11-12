import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jform.app"),
  title: {
    default: "JForm - JSON Formatter, Beautifier & Validator",
    template: "%s | JForm",
  },
  description:
    "Free online JSON formatter, beautifier, validator, and viewer. Format, validate, and beautify JSON data instantly. The best, most powerful, and most convenient JSON formatter tool.",
  keywords: [
    "JSON formatter",
    "JSON beautifier",
    "JSON validator",
    "JSON viewer",
    "JSON parser",
    "format JSON",
    "pretty print JSON",
    "JSON tool",
    "JSON online",
    "JSON formatter online",
    "JSON beautifier online",
    "JSON validator online",
    "JSON 포맷터",
    "JSON 포맷",
    "JSON 검증",
    "JSON 뷰어",
  ],
  authors: [{ name: "JForm" }],
  creator: "JForm",
  publisher: "JForm",
  applicationName: "JForm",
  referrer: "origin-when-cross-origin",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  alternates: {
    canonical: "https://jform.app",
    languages: {
      "en-US": "https://jform.app",
      "ko-KR": "https://jform.app",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["ko_KR"],
    url: "https://jform.app",
    siteName: "JForm",
    title: "JForm - JSON Formatter, Beautifier & Validator",
    description:
      "Free online JSON formatter, beautifier, validator, and viewer. Format, validate, and beautify JSON data instantly.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "JForm - JSON Formatter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JForm - JSON Formatter, Beautifier & Validator",
    description:
      "Free online JSON formatter, beautifier, validator, and viewer. Format, validate, and beautify JSON data instantly.",
    images: ["/logo.png"],
    creator: "@jform",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Google Search Console verification can be added here
    // google: "verification_token",
  },
  category: "developer tools",
};

