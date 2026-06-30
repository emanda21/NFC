"use client";

/**
 * @file src/app/admin/_components/AdminNavbar.tsx
 * @description Daris NFC — Fixed top navbar for the Admin Dashboard.
 *   Background: dark maroon/burgundy (#2B0A11)
 *   Logo: Gold text placeholder — swap the <img> src when the asset is ready.
 */

import React from "react";

/* ─── Brand tokens ─────────────────────────────────────────────────────────── */
const MAROON = "#2B0A11";
const GOLD   = "#d4af37";
const GOLD_L = "#e8c84a";

interface AdminNavbarProps {
  /** Name of the card currently being edited (shows in breadcrumb). */
  cardName?: string;
  /** Whether the form is in "edit existing" mode vs "create new". */
  isEditing?: boolean;
}

export default function AdminNavbar({ cardName, isEditing }: AdminNavbarProps) {
  return (
    <header
      id="admin-navbar"
      className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center gap-4 px-5 shadow-lg"
      style={{
        backgroundColor: MAROON,
        borderBottom: `1px solid ${GOLD}33`,
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 shrink-0">
        {/*
          TODO: Replace the placeholder below with your actual logo image.
          Example:
            <img
              src="/images/daris-nfc-logo.png"
              alt="DARIS NFC Solutions"
              className="h-9 w-auto object-contain"
            />
        */}
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black shadow-md shrink-0"
          style={{
            background: `linear-gradient(135deg, ${GOLD_L} 0%, ${GOLD} 100%)`,
            color: MAROON,
          }}
        >
          D
        </div>
        <span className="text-base font-black tracking-tight text-white select-none">
          DARIS{" "}
          <span style={{ color: GOLD }}>NFC Solutions</span>
        </span>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div
        className="hidden sm:block h-6 w-px mx-1"
        style={{ backgroundColor: `${GOLD}33` }}
      />

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <nav
        className="hidden sm:flex items-center gap-1.5 text-xs min-w-0"
        style={{ color: "rgba(255,255,255,0.45)" }}
      >
        <span className="shrink-0">Admin</span>
        <span style={{ color: "rgba(255,255,255,0.25)" }}>/</span>
        <span className="font-semibold text-white shrink-0">
          {isEditing ? "Edit Card" : "New Card"}
        </span>
        {cardName && (
          <>
            <span style={{ color: "rgba(255,255,255,0.25)" }}>/</span>
            <span
              className="truncate max-w-[160px]"
              style={{ color: GOLD, fontWeight: 600 }}
            >
              {cardName}
            </span>
          </>
        )}
      </nav>

      {/* ── Right slot — admin badge ───────────────────────────────────────── */}
      <div className="ml-auto flex items-center gap-2 shrink-0">
        <span
          className="hidden lg:block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: `${GOLD}18`,
            color: GOLD,
            border: `1px solid ${GOLD}44`,
          }}
        >
          Admin
        </span>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black"
          style={{
            backgroundColor: `${GOLD}22`,
            color: GOLD,
            border: `2px solid ${GOLD}55`,
          }}
        >
          A
        </div>
      </div>
    </header>
  );
}
