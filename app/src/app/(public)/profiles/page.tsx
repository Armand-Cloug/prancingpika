// src/app/(public)/profiles/page.tsx
import type { Metadata } from "next";
import ProfilesClient from "@/components/page/public/profiles/ProfilesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Players | PrancingPika",
  description: "Browse community profiles on PrancingPika.",
};

async function fetchProfiles() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/public/profiles/list`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function ProfilesPage() {
  const profiles = await fetchProfiles();
  return <ProfilesClient initialProfiles={profiles} />;
}
