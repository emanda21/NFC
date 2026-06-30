/**
 * @file src/app/admin/page.tsx
 * @description Daris NFC — Admin Dashboard (server wrapper).
 *   Pre-fetches the full profile list server-side to avoid client waterfall.
 */

import type { Metadata } from "next";
import { getAllProfiles } from "@/actions/profileActions";
import AdminDashboard from "./_components/AdminProfileForm";
import type { Profile } from "@/types/profile";

export const metadata: Metadata = {
  title: "Admin Dashboard | Daris NFC",
  description: "Create and manage Daris NFC Digital Business Cards.",
};

export default async function AdminPage() {
  // Pre-fetch profiles server-side so the client gets an instant list
  const result = await getAllProfiles(undefined, 200);
  const initialProfiles: Profile[] = result.success ? result.data : [];

  return <AdminDashboard initialProfiles={initialProfiles} />;
}
