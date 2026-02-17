import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Judge — Multi-model Evaluation Engine",
  description: "Compare LLM outputs in parallel and have a judge model pick the best response",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
