import type { Metadata } from "next";
import "./globals.css";
import { SCHOOL_NAME, CHATBOT_NAME } from "./lib/school-config";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: `${CHATBOT_NAME} — ${SCHOOL_NAME} AI Assistant`,
  description: `Ask the ${SCHOOL_NAME} AI assistant about admissions, fees, curriculum, sport, and school life.`,
  icons: {
    icon: `${basePath}/favicon.png`,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1B4F72" />
        <link rel="icon" href={`${basePath}/favicon.png`} type="image/png" />
      </head>
      <body style={{ background: "#ffffff", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
