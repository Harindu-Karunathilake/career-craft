import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Career Craft",
  description: "Sign in to your Career Craft account to continue your career journey.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
