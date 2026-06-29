/**
 * @file src/app/admin/page.tsx
 * @description Daris NFC — Card Builder page (server wrapper).
 */

import type { Metadata } from "next";
import CardBuilder from "./_components/AdminProfileForm";

export const metadata: Metadata = {
  title: "Card Builder | Daris NFC Admin",
  description: "Create a stunning Daris NFC Digital Business Card.",
};

export default function AdminPage() {
  return <CardBuilder />;
}
