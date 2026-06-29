/**
 * @file src/app/p/[slug]/page.tsx
 * @description Public profile page – Server Component.
 *
 * Renders the digital business card for a given slug.
 * Calls `getProfileBySlug` server action and shows a 404 if not found.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProfileBySlug } from "@/actions/profileActions";
import type { Profile } from "@/types/profile";
import PublicCard from "./_components/PublicCard";
import SaveContactBtn from "./_components/SaveContactBtn";

// ─── Dynamic metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const result = await getProfileBySlug(params.slug);
  if (!result.success) return { title: "Profile Not Found" };

  const profile: Profile = result.data;
  return {
    title: `${profile.name} | Daris NFC`,
    description: profile.bio ?? `View ${profile.name}'s digital business card.`,
  };
}

// ─── Page component ───────────────────────────────────────────────────────────

export default async function ProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const result = await getProfileBySlug(params.slug);

  // Trigger Next.js 404 if profile doesn't exist
  if (!result.success) notFound();

  const profile: Profile = result.data;

  return (
    <>
      <PublicCard profile={profile} />
      <SaveContactBtn profile={profile} />
    </>
  );
}
