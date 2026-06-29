"use client";

import { useMemo } from "react";
import type { Profile } from "@/types/profile";

/* ── Brand tokens ── */
const BURGUNDY = "#3d1313";
const GOLD     = "#d4af37";

export default function SaveContactBtn({ profile }: { profile: Profile }) {
  // Generate vCard data
  const vcfData = useMemo(() => {
    const ci = profile.contact_info;
    const parts = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${profile.name}`,
    ];

    if (ci?.company || ci?.job_title) {
      parts.push(`ORG:${ci.company || ""}`);
      if (ci.job_title) parts.push(`TITLE:${ci.job_title}`);
    }

    if (ci?.phone) {
      parts.push(`TEL;TYPE=CELL:${ci.phone}`);
    }

    if (ci?.email) {
      parts.push(`EMAIL;TYPE=WORK,INTERNET:${ci.email}`);
    }

    if (ci?.website) {
      parts.push(`URL:${ci.website}`);
    }

    if (profile.bio) {
      // Escape newlines for vCard format
      parts.push(`NOTE:${profile.bio.replace(/\n/g, "\\n")}`);
    }

    parts.push("END:VCARD");
    return parts.join("\r\n");
  }, [profile]);

  const handleDownload = () => {
    const blob = new Blob([vcfData], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.name.replace(/ /g, "_")}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-6 flex justify-center pointer-events-none">
      {/* White gradient fade — matches the new bg-white of the public card */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-36"
        style={{
          background: `linear-gradient(to top, rgba(255,255,255,1) 35%, transparent)`,
        }}
      />

      {/* Gold "Save Contact" button with dark burgundy text */}
      <button
        id="save-contact-btn"
        onClick={handleDownload}
        className="pointer-events-auto relative flex w-full max-w-sm items-center justify-center gap-2.5 rounded-2xl px-6 py-4 text-lg font-black transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: `linear-gradient(135deg, #e8c84a 0%, ${GOLD} 50%, #b8922a 100%)`,
          color: BURGUNDY,
          boxShadow: `0 8px 32px ${GOLD}55, 0 20px 60px rgba(0,0,0,0.4)`,
        }}
      >
        {/* Save / floppy icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        Save Contact
      </button>
    </div>
  );
}
