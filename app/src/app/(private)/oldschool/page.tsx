// src/app/(public)/oldschool/page.tsx
import type { Metadata } from "next";
import OldSchoolPage from "@/components/page/private/oldschool/OldSchoolPage";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return <OldSchoolPage />;
}