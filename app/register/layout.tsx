import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join Career Craft | Start Your Journey",
  description: "Create your account on Career Craft and unlock AI-powered career tools.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
