"use client";

/**
 * @file src/app/admin/_components/AdminProfileForm.tsx
 * @description Daris NFC — Full Admin Dashboard with CRUD.
 *
 * Layout (desktop, 3-column):
 *   [Left  ~280px] Customer List sidebar  — Cream (#FFFDD0)
 *   [Center  flex] Card Builder form      — White with grid overlay
 *   [Right  ~280px] Live Phone Preview    — White (sticky)
 *
 * Features:
 *   • Search customers by name (client-side, real-time)
 *   • Click customer → populate form (UPDATE mode)
 *   • "Add New Customer" button → reset form (INSERT mode)
 *   • Calls createProfile (new) or updateProfile (existing) accordingly
 *   • In-place list update after save — no full page reload
 */

import React, {
  useState,
  useTransition,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { createProfile, updateProfile } from "@/actions/profileActions";
import { uploadFile } from "@/utils/supabase/storage";
import type {
  Profile,
  ProfileType,
  ContactInfo,
  CustomLink,
  SocialLink,
} from "@/types/profile";
import AdminNavbar from "./AdminNavbar";
import {
  FaLinkedinIn,
  FaInstagram,
  FaXTwitter,
  FaFacebookF,
  FaYoutube,
  FaTiktok,
  FaWhatsapp,
  FaTelegram,
} from "react-icons/fa6";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════════ */

interface CardData {
  name: string;
  jobTitle: string;
  company: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  logoUrl: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  linkedin: string;
  instagram: string;
  twitter: string;
  facebook: string;
  youtube: string;
  tiktok: string;
  whatsapp: string;
  telegram: string;
  profileType: ProfileType;
  customLinks: { title: string; url: string }[];
  brandColor: string;
  slug: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS & BRAND TOKENS
═══════════════════════════════════════════════════════════════════════════ */

const BP  = "#3d1313"; // Deep Burgundy
const BPL = "#4a1c1c"; // Lighter Burgundy
const BG  = "#d4af37"; // Luxury Gold
const BGL = "#e8c84a"; // Gold Light

const CREAM      = "#FFFDD0";
const CREAM_DARK = "#F5EDB0"; // slightly darker for hover/active states

const INITIAL_CARD: CardData = {
  name: "", jobTitle: "", company: "", bio: "",
  avatarUrl: "", coverUrl: "", logoUrl: "",
  email: "", phone: "", website: "", address: "",
  linkedin: "", instagram: "", twitter: "", facebook: "", youtube: "",
  tiktok: "", whatsapp: "", telegram: "",
  profileType: "individual",
  customLinks: [{ title: "", url: "" }],
  brandColor: "#3d1313",
  slug: "",
};

/** Types that show Company Logo in the main avatar circle */
const LOGO_TYPES: ProfileType[] = ["business", "hotel", "restaurant", "legal"];

const PRESET_COLORS = [
  "#3d1313", "#4a1c1c", "#1e3a5f", "#1a4731",
  "#3d1a5c", "#4a3b1c", "#1c3a4a", "#5c1a2e",
];

const PROFILE_TYPES: { value: ProfileType; label: string; emoji: string }[] = [
  { value: "individual",  label: "Individual",  emoji: "👤" },
  { value: "business",    label: "Business",    emoji: "🏢" },
  { value: "hotel",       label: "Hotel",       emoji: "🏨" },
  { value: "restaurant",  label: "Restaurant",  emoji: "🍽️" },
  { value: "legal",       label: "Legal",       emoji: "⚖️" },
];

type SocialKey =
  | "linkedin" | "instagram" | "twitter" | "facebook"
  | "youtube"  | "tiktok"   | "whatsapp" | "telegram";

interface SocialFieldDef {
  key: SocialKey;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  iconBg: string;
  label: string;
  placeholder: string;
}

const SOCIAL_FIELDS: SocialFieldDef[] = [
  { key: "linkedin",  Icon: FaLinkedinIn, iconBg: "#0a66c2", label: "LinkedIn",    placeholder: "https://linkedin.com/in/username" },
  { key: "instagram", Icon: FaInstagram,  iconBg: "#e1306c", label: "Instagram",   placeholder: "https://instagram.com/username" },
  { key: "twitter",   Icon: FaXTwitter,   iconBg: "#000000", label: "Twitter / X", placeholder: "https://x.com/username" },
  { key: "facebook",  Icon: FaFacebookF,  iconBg: "#1877f2", label: "Facebook",    placeholder: "https://facebook.com/username" },
  { key: "youtube",   Icon: FaYoutube,    iconBg: "#ff0000", label: "YouTube",     placeholder: "https://youtube.com/@channel" },
  { key: "tiktok",    Icon: FaTiktok,     iconBg: "#010101", label: "TikTok",      placeholder: "https://tiktok.com/@username" },
  { key: "whatsapp",  Icon: FaWhatsapp,   iconBg: "#25d366", label: "WhatsApp",    placeholder: "https://wa.me/971500000000" },
  { key: "telegram",  Icon: FaTelegram,   iconBg: "#229ed9", label: "Telegram",    placeholder: "https://t.me/username" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED STYLES
═══════════════════════════════════════════════════════════════════════════ */

const INPUT_CLS =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 " +
  "placeholder-gray-400 transition-colors " +
  "focus:outline-none focus:border-[#3d1313] focus:ring-2 focus:ring-[#3d1313]/10";

const LABEL_CLS =
  "block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5";

function cx(...cls: (string | false | null | undefined)[]): string {
  return cls.filter(Boolean).join(" ");
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS — Profile ↔ CardData mapping
═══════════════════════════════════════════════════════════════════════════ */

/** Map a social platform name (e.g. "LinkedIn") to the CardData key. */
function platformToKey(platform: string): SocialKey | null {
  const map: Record<string, SocialKey> = {
    linkedin:  "linkedin",  LinkedIn:  "linkedin",
    instagram: "instagram", Instagram: "instagram",
    twitter:   "twitter",   Twitter:   "twitter",   "Twitter / X": "twitter",
    facebook:  "facebook",  Facebook:  "facebook",
    youtube:   "youtube",   YouTube:   "youtube",
    tiktok:    "tiktok",    TikTok:    "tiktok",
    whatsapp:  "whatsapp",  WhatsApp:  "whatsapp",
    telegram:  "telegram",  Telegram:  "telegram",
  };
  return map[platform] ?? null;
}

/** Convert a Supabase Profile row into a CardData object for the form. */
function profileToCardData(p: Profile): CardData {
  const ci = p.contact_info ?? {};
  const card: CardData = {
    name:        p.name,
    jobTitle:    ci.job_title   ?? "",
    company:     ci.company     ?? "",
    bio:         p.bio          ?? "",
    avatarUrl:   p.avatar_url   ?? "",
    coverUrl:    ci.cover_url   ?? "",
    logoUrl:     ci.logo_url    ?? "",
    email:       ci.email       ?? "",
    phone:       ci.phone       ?? "",
    website:     ci.website     ?? "",
    address:     ci.address     ?? "",
    linkedin:    "",
    instagram:   "",
    twitter:     "",
    facebook:    "",
    youtube:     "",
    tiktok:      "",
    whatsapp:    "",
    telegram:    "",
    profileType: p.profile_type,
    customLinks: p.custom_links?.length
      ? p.custom_links.map(l => ({ title: l.title, url: l.url }))
      : [{ title: "", url: "" }],
    brandColor:  ci.brand_color ?? "#3d1313",
    slug:        p.slug,
  };

  // Map social links back to their respective fields
  if (p.social_links) {
    for (const sl of p.social_links) {
      const key = platformToKey(sl.platform);
      if (key) card[key] = sl.url;
    }
  }

  return card;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROFILE_TYPE BADGE colors (for list sidebar)
═══════════════════════════════════════════════════════════════════════════ */

const TYPE_BADGE: Record<ProfileType, { bg: string; text: string; emoji: string }> = {
  individual:  { bg: "#e8f5e9", text: "#2e7d32", emoji: "👤" },
  business:    { bg: "#e3f2fd", text: "#1565c0", emoji: "🏢" },
  hotel:       { bg: "#fce4ec", text: "#c62828", emoji: "🏨" },
  restaurant:  { bg: "#fff3e0", text: "#e65100", emoji: "🍽️" },
  legal:       { bg: "#f3e5f5", text: "#6a1b9a", emoji: "⚖️" },
};

/* ═══════════════════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════════════════ */

interface ToastState {
  type: "success" | "error";
  message: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

interface AdminDashboardProps {
  initialProfiles: Profile[];
}

export default function AdminDashboard({ initialProfiles }: AdminDashboardProps) {
  const [isPending, startTransition] = useTransition();

  // ── Form state ─────────────────────────────────────────────────────────
  const [card, setCard]           = useState<CardData>(INITIAL_CARD);
  const [editingId, setEditingId] = useState<string | null>(null); // null = new
  const [openField, setOpenField] = useState<string | null>(null);
  const [error, setError]         = useState("");
  const [toast, setToast]         = useState<ToastState | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  // ── Dashboard / list state ─────────────────────────────────────────────
  const [profiles, setProfiles]   = useState<Profile[]>(initialProfiles);
  const [searchQuery, setSearchQuery] = useState("");

  // Mobile view: "list" | "form"
  const [mobileView, setMobileView] = useState<"list" | "form">("list");

  /* ── State helpers ── */
  const update = useCallback(
    <K extends keyof CardData>(key: K, val: CardData[K]) =>
      setCard(prev => ({ ...prev, [key]: val })),
    []
  );

  const toggleField = (id: string) =>
    setOpenField(prev => (prev === id ? null : id));

  const updateCL = (i: number, k: "title" | "url", v: string) =>
    setCard(prev => ({
      ...prev,
      customLinks: prev.customLinks.map((l, j) => (j === i ? { ...l, [k]: v } : l)),
    }));

  const addCL = () =>
    setCard(prev => ({ ...prev, customLinks: [...prev.customLinks, { title: "", url: "" }] }));

  const removeCL = (i: number) =>
    setCard(prev => ({ ...prev, customLinks: prev.customLinks.filter((_, j) => j !== i) }));

  /* ── Load a profile into the form (EDIT mode) ── */
  const loadProfile = useCallback((p: Profile) => {
    setEditingId(p.id);
    setCard(profileToCardData(p));
    setError("");
    setToast(null);
    setOpenField(null);
    setMobileView("form");
  }, []);

  /* ── Reset to blank form (CREATE mode) ── */
  const resetForm = useCallback(() => {
    setEditingId(null);
    setCard(INITIAL_CARD);
    setError("");
    setToast(null);
    setOpenField(null);
    setMobileView("form");
  }, []);

  /* ── Filtered list ── */
  const filteredProfiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(p => p.name.toLowerCase().includes(q));
  }, [profiles, searchQuery]);

  /* ── Toast helper ── */
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  /* ── File Upload ── */
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldKey: keyof CardData
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [fieldKey]: true }));
    setError("");

    try {
      const publicUrl = await uploadFile(file, "logos", fieldKey);
      update(fieldKey, publicUrl as CardData[keyof CardData]);
    } catch (err: any) {
      setError(`Failed to upload ${fieldKey}: ${err.message}`);
    } finally {
      setUploading(prev => ({ ...prev, [fieldKey]: false }));
    }
  };

  /* ── Build payload ── */
  const buildPayload = () => {
    const ci: ContactInfo = {};
    if (card.email)     ci.email       = card.email;
    if (card.phone)     ci.phone       = card.phone;
    if (card.website)   ci.website     = card.website;
    if (card.address)   ci.address     = card.address;
    if (card.jobTitle)  ci.job_title   = card.jobTitle;
    if (card.company)   ci.company     = card.company;
    if (card.brandColor) ci.brand_color = card.brandColor;
    if (card.coverUrl)  ci.cover_url   = card.coverUrl;
    if (card.logoUrl)   ci.logo_url    = card.logoUrl;

    const socialPairs: [string, string][] = [
      ["LinkedIn",    card.linkedin],
      ["Instagram",   card.instagram],
      ["Twitter",     card.twitter],
      ["Facebook",    card.facebook],
      ["YouTube",     card.youtube],
      ["TikTok",      card.tiktok],
      ["WhatsApp",    card.whatsapp],
      ["Telegram",    card.telegram],
    ];
    const sl: SocialLink[] = socialPairs
      .filter(([, url]) => url.trim())
      .map(([platform, url]) => ({ platform, url }));

    const cl: CustomLink[] = card.customLinks.filter(
      l => l.title.trim() && l.url.trim()
    );

    return {
      profile_type: card.profileType,
      name:         card.name.trim(),
      bio:          card.bio.trim() || null,
      avatar_url:   card.avatarUrl || null,
      contact_info: Object.keys(ci).length ? ci : null,
      social_links: sl.length ? sl : null,
      custom_links: cl.length ? cl : null,
      slug:         card.slug?.trim() || "",
    };
  };

  /* ── Submit (INSERT or UPDATE) ── */
  const handleSave = () => {
    setError("");
    if (!card.name.trim()) {
      setError("A name is required.");
      setOpenField("name");
      return;
    }

    startTransition(async () => {
      const payload = buildPayload();

      if (editingId) {
        /* ── UPDATE existing profile ── */
        const result = await updateProfile({ id: editingId, ...payload });

        if (!result.success) {
          setError(result.error);
          return;
        }

        if (result.data) {
          // Refresh the card slug in form (in case it changed)
          setCard(prev => ({ ...prev, slug: result.data!.slug }));

          // Update the profile in the local list
          setProfiles(prev =>
            prev.map(p => (p.id === editingId ? result.data! : p))
          );
        } else {
          // If no data is returned (e.g., due to RLS), optimistically update the local list
          const optimisticProfile = {
             ...payload,
             id: editingId,
             created_at: new Date().toISOString(), // keep a fallback
          } as Profile;
          
          setProfiles(prev =>
            prev.map(p => (p.id === editingId ? { ...p, ...optimisticProfile } : p))
          );
        }

        showToast("success", "Profile Updated Successfully!");
      } else {
        /* ── CREATE new profile ── */
        const result = await createProfile(payload);

        if (!result.success) {
          setError(result.error);
          return;
        }

        // Switch to edit mode for the newly-created profile
        setEditingId(result.data.id);
        setCard(prev => ({ ...prev, slug: result.data.slug }));

        // Re-fetch is expensive; optimistically add a minimal entry to the list
        const newProfile: Profile = {
          id:           result.data.id,
          slug:         result.data.slug,
          profile_type: card.profileType,
          name:         card.name.trim(),
          bio:          card.bio.trim() || null,
          avatar_url:   card.avatarUrl || null,
          contact_info: buildPayload().contact_info ?? null,
          social_links: buildPayload().social_links ?? null,
          custom_links: buildPayload().custom_links ?? null,
          created_at:   new Date().toISOString(),
        };
        setProfiles(prev => [newProfile, ...prev]);

        showToast("success", `"${card.name.trim()}" created! Slug: /p/${result.data.slug}`);
      }
    });
  };

  const isBusinessType = LOGO_TYPES.includes(card.profileType);

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-white">

      {/* ═══ FIXED TOP NAVBAR ═══════════════════════════════════════════════ */}
      <AdminNavbar
        cardName={card.name || undefined}
        isEditing={!!editingId}
      />

      {/* ═══ BODY — starts below fixed navbar (pt-16) ═══════════════════════ */}
      <div className="flex pt-16" style={{ minHeight: "100vh" }}>

        {/* ─── LEFT SIDEBAR: Customer List (Cream) ─────────────────────────── */}
        <aside
          id="customer-list-sidebar"
          className={cx(
            "shrink-0 flex flex-col border-r overflow-hidden",
            "w-full lg:w-72 xl:w-80",
            // On mobile: show only when mobileView === "list"
            mobileView === "list" ? "flex" : "hidden lg:flex"
          )}
          style={{
            backgroundColor: CREAM,
            borderColor: "#e5d58e",
            height: "calc(100vh - 4rem)",
            position: "sticky",
            top: "4rem",
          }}
        >
          {/* Sidebar header */}
          <div
            className="px-4 pt-5 pb-3 shrink-0"
            style={{ borderBottom: `1px solid #e5d58e` }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">
                Customers
              </h2>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${BP}18`, color: BP }}
              >
                {profiles.length}
              </span>
            </div>

            {/* Search input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                🔍
              </span>
              <input
                id="customer-search"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name…"
                className="w-full rounded-xl border border-yellow-200 bg-white pl-9 pr-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#3d1313] focus:ring-2 focus:ring-[#3d1313]/10 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Add New button */}
            <button
              id="add-new-customer-btn"
              type="button"
              onClick={resetForm}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-100"
              style={{
                background: `linear-gradient(135deg, ${BGL} 0%, ${BG} 100%)`,
                color: BP,
                boxShadow: `0 4px 16px ${BG}44`,
              }}
            >
              <span className="text-base">+</span>
              Add New Customer
            </button>
          </div>

          {/* Customer list */}
          <div className="flex-1 overflow-y-auto py-2">
            {filteredProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <span className="text-3xl mb-2">🗂️</span>
                <p className="text-sm font-semibold text-gray-500">
                  {searchQuery ? "No results found" : "No customers yet"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchQuery ? "Try a different search" : "Add your first customer above"}
                </p>
              </div>
            ) : (
              filteredProfiles.map(p => {
                const isActive = editingId === p.id;
                const badge    = TYPE_BADGE[p.profile_type] ?? TYPE_BADGE.individual;

                return (
                  <button
                    key={p.id}
                    id={`customer-item-${p.id}`}
                    type="button"
                    onClick={() => loadProfile(p)}
                    className={cx(
                      "w-full text-left px-4 py-3 transition-all duration-150 border-l-4 group",
                      isActive
                        ? "border-l-[#3d1313] bg-white shadow-sm"
                        : "border-l-transparent hover:bg-yellow-50"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar / initial */}
                      <div
                        className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-sm font-black overflow-hidden"
                        style={{
                          backgroundColor: isActive ? BP : `${BP}18`,
                          color: isActive ? BG : BP,
                          border: isActive ? `2px solid ${BG}` : "2px solid transparent",
                        }}
                      >
                        {p.avatar_url ? (
                          <img
                            src={p.avatar_url}
                            alt=""
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          p.name.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={cx(
                            "text-sm font-bold truncate",
                            isActive ? "text-[#3d1313]" : "text-gray-800"
                          )}
                        >
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          /p/{p.slug}
                        </p>
                      </div>

                      {/* Type badge */}
                      <span
                        className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {badge.emoji}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ─── CENTER: Card Builder Form (White) ───────────────────────────── */}
        <main
          id="card-builder-form"
          className={cx(
            "flex-1 overflow-y-auto pb-36",
            mobileView === "form" ? "flex flex-col" : "hidden lg:flex lg:flex-col"
          )}
          style={{
            backgroundColor: "#ffffff",
            backgroundImage:
              "linear-gradient(rgba(61,19,19,0.03) 1px, transparent 1px), " +
              "linear-gradient(90deg, rgba(61,19,19,0.03) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          <div className="mx-auto w-full max-w-lg px-6 pt-8">

            {/* Mobile back button */}
            <button
              type="button"
              onClick={() => setMobileView("list")}
              className="lg:hidden mb-4 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition"
            >
              ← Back to List
            </button>

            {/* Page heading */}
            <div className="mb-7">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black tracking-tight" style={{ color: BP }}>
                  {editingId ? (
                    <>
                      Edit{" "}
                      <span style={{ color: BG }}>{card.name || "Profile"}</span>
                    </>
                  ) : (
                    <>
                      Create your{" "}
                      <span style={{ color: BG }}>Daris NFC</span>{" "}
                      card
                    </>
                  )}
                </h1>
                {editingId && (
                  <span
                    className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: `${BG}20`, color: BP, border: `1px solid ${BG}50` }}
                  >
                    Editing
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {editingId
                  ? `Editing /p/${card.slug || "…"} — changes save to Supabase instantly.`
                  : "Fill in the details below. Your card goes live the moment you save."}
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="text-base">⚠️</span>
                <span className="flex-1">{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="text-red-400 hover:text-red-600 font-bold"
                >
                  ×
                </button>
              </div>
            )}

            {/* Toast */}
            {toast && (
              <div
                className={cx(
                  "mb-6 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm",
                  toast.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                )}
              >
                <span className="text-base">{toast.type === "success" ? "✅" : "⚠️"}</span>
                <span className="flex-1">{toast.message}</span>
                <button
                  type="button"
                  onClick={() => setToast(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold"
                >
                  ×
                </button>
              </div>
            )}

            {/* Mobile-only preview */}
            <div className="mb-8 overflow-hidden rounded-3xl shadow-2xl xl:hidden">
              <div
                className="relative h-64"
                style={{ background: `linear-gradient(145deg, ${BP} 0%, #1a0808 100%)` }}
              >
                <div
                  className="absolute inset-2 overflow-hidden rounded-2xl bg-white"
                  style={{ border: `4px solid ${BG}55` }}
                >
                  <div className="h-full overflow-y-hidden">
                    <CardInPhone card={card} compact />
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION: Card Type ─────────────────────────────────────── */}
            <SectionGroup title="Card Type">
              <div className="grid grid-cols-5 gap-2">
                {PROFILE_TYPES.map(({ value, label, emoji }) => {
                  const active = card.profileType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update("profileType", value)}
                      className={cx(
                        "flex flex-col items-center gap-1.5 rounded-2xl border py-3 px-1",
                        "text-center transition-all duration-200 focus:outline-none",
                        active
                          ? "border-transparent text-white shadow-lg"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:shadow-sm"
                      )}
                      style={active ? { backgroundColor: BP, borderColor: BP } : {}}
                    >
                      <span className="text-xl">{emoji}</span>
                      <span className="text-[10px] font-bold leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>
              <div
                className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ backgroundColor: `${BG}12`, border: `1px solid ${BG}30` }}
              >
                <span className="text-sm">{isBusinessType ? "🏢" : "👤"}</span>
                <p className="text-[11px] font-semibold" style={{ color: BP }}>
                  {isBusinessType
                    ? "Your Company Logo will appear in the main avatar circle"
                    : "Your Profile Picture will appear in the main avatar circle"}
                </p>
              </div>
            </SectionGroup>

            {/* ── SECTION: Images ──────────────────────────────────────── */}
            <SectionGroup title="Add Images">
              <div className="grid grid-cols-3 gap-3">
                <ImageUploadBtn
                  label={isBusinessType ? "Company Logo ★" : "Profile Picture ★"}
                  icon={isBusinessType ? "🏢" : "👤"}
                  isUploading={!!uploading[isBusinessType ? "logoUrl" : "avatarUrl"]}
                  imageUrl={isBusinessType ? card.logoUrl : card.avatarUrl}
                  onUpload={e => handleFileUpload(e, isBusinessType ? "logoUrl" : "avatarUrl")}
                  highlight
                />
                <ImageUploadBtn
                  label="Cover Photo"
                  icon="🖼️"
                  isUploading={!!uploading.coverUrl}
                  imageUrl={card.coverUrl}
                  onUpload={e => handleFileUpload(e, "coverUrl")}
                />
                {isBusinessType ? (
                  <ImageUploadBtn
                    label="Profile Photo"
                    icon="👤"
                    isUploading={!!uploading.avatarUrl}
                    imageUrl={card.avatarUrl}
                    onUpload={e => handleFileUpload(e, "avatarUrl")}
                  />
                ) : (
                  <ImageUploadBtn
                    label="Company Logo"
                    icon="🏢"
                    isUploading={!!uploading.logoUrl}
                    imageUrl={card.logoUrl}
                    onUpload={e => handleFileUpload(e, "logoUrl")}
                  />
                )}
              </div>
            </SectionGroup>

            {/* ── SECTION: Brand ────────────────────────────────────────── */}
            <SectionGroup title="Brand">
              <ExpandableField
                id="brandColor" icon="🎨" label="Brand Colour"
                value={card.brandColor} isOpen={openField === "brandColor"}
                onToggle={() => toggleField("brandColor")}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="color"
                    value={card.brandColor}
                    onChange={e => update("brandColor", e.target.value)}
                    className="h-11 w-11 cursor-pointer rounded-xl border-2 border-gray-200 bg-white p-1 transition hover:border-gray-300"
                  />
                  <div className="flex-1">
                    <label className={LABEL_CLS}>Hex Code</label>
                    <input
                      type="text"
                      value={card.brandColor}
                      onChange={e => update("brandColor", e.target.value)}
                      placeholder="#3d1313"
                      className={INPUT_CLS}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="mb-2 text-xs font-medium text-gray-400">Quick presets</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => update("brandColor", c)}
                        className="h-8 w-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
                        style={{
                          backgroundColor: c,
                          border: card.brandColor === c ? `3px solid ${BG}` : "3px solid transparent",
                          boxShadow: card.brandColor === c ? `0 0 0 2px ${BG}50` : "none",
                        }}
                        aria-label={`Select color ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </ExpandableField>

              <ExpandableField
                id="slug" icon="🔗" label="Card URL Slug"
                value={card.slug ? `/p/${card.slug}` : ""}
                isOpen={openField === "slug"}
                onToggle={() => toggleField("slug")}
              >
                <label className={LABEL_CLS}>Custom URL Path</label>
                <div className="flex">
                  <span className="inline-flex select-none items-center rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 px-3 text-xs text-gray-400">
                    /p/
                  </span>
                  <input
                    type="text"
                    value={card.slug}
                    onChange={e => update("slug", e.target.value)}
                    placeholder="your-name"
                    className={cx(INPUT_CLS, "rounded-l-none")}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Leave blank to auto-generate from name.{" "}
                  {editingId && (
                    <span className="font-semibold text-amber-600">
                      ⚠ Changing the slug will break existing NFC card links!
                    </span>
                  )}
                </p>
              </ExpandableField>
            </SectionGroup>

            {/* ── SECTION: Personal ─────────────────────────────────────── */}
            <SectionGroup title="Personal">
              <ExpandableField
                id="name" icon="👤" label="Full Name *"
                value={card.name} isOpen={openField === "name"}
                onToggle={() => toggleField("name")}
              >
                <label className={LABEL_CLS}>Full Name *</label>
                <input
                  type="text"
                  value={card.name}
                  onChange={e => update("name", e.target.value)}
                  placeholder="e.g. Ahmed Al-Rashid"
                  className={INPUT_CLS}
                />
              </ExpandableField>

              <ExpandableField
                id="jobTitle" icon="💼" label="Job Title"
                value={card.jobTitle} isOpen={openField === "jobTitle"}
                onToggle={() => toggleField("jobTitle")}
              >
                <label className={LABEL_CLS}>Job Title</label>
                <input
                  type="text"
                  value={card.jobTitle}
                  onChange={e => update("jobTitle", e.target.value)}
                  placeholder="e.g. Founder & CEO"
                  className={INPUT_CLS}
                />
              </ExpandableField>

              <ExpandableField
                id="company" icon="🏢" label="Company / Brand"
                value={card.company} isOpen={openField === "company"}
                onToggle={() => toggleField("company")}
              >
                <label className={LABEL_CLS}>Company</label>
                <input
                  type="text"
                  value={card.company}
                  onChange={e => update("company", e.target.value)}
                  placeholder="e.g. Daris NFC Solutions"
                  className={INPUT_CLS}
                />
              </ExpandableField>

              <ExpandableField
                id="bio" icon="📝" label="Bio / Tagline"
                value={card.bio} isOpen={openField === "bio"}
                onToggle={() => toggleField("bio")}
              >
                <label className={LABEL_CLS}>Bio</label>
                <textarea
                  rows={3}
                  value={card.bio}
                  onChange={e => update("bio", e.target.value)}
                  placeholder="A short description about you or your business…"
                  className={cx(INPUT_CLS, "resize-none leading-relaxed")}
                />
              </ExpandableField>
            </SectionGroup>

            {/* ── SECTION: Contact ──────────────────────────────────────── */}
            <SectionGroup title="Contact">
              <ExpandableField
                id="email" icon="✉️" label="Email Address"
                value={card.email} isOpen={openField === "email"}
                onToggle={() => toggleField("email")}
              >
                <label className={LABEL_CLS}>Email</label>
                <input type="email" value={card.email}
                  onChange={e => update("email", e.target.value)}
                  placeholder="you@example.com" className={INPUT_CLS} />
              </ExpandableField>

              <ExpandableField
                id="phone" icon="📞" label="Phone Number"
                value={card.phone} isOpen={openField === "phone"}
                onToggle={() => toggleField("phone")}
              >
                <label className={LABEL_CLS}>Phone</label>
                <input type="tel" value={card.phone}
                  onChange={e => update("phone", e.target.value)}
                  placeholder="+971 50 000 0000" className={INPUT_CLS} />
              </ExpandableField>

              <ExpandableField
                id="website" icon="🌐" label="Website"
                value={card.website} isOpen={openField === "website"}
                onToggle={() => toggleField("website")}
              >
                <label className={LABEL_CLS}>Website URL</label>
                <input type="url" value={card.website}
                  onChange={e => update("website", e.target.value)}
                  placeholder="https://example.com" className={INPUT_CLS} />
              </ExpandableField>

              <ExpandableField
                id="address" icon="📍" label="Address / Location"
                value={card.address} isOpen={openField === "address"}
                onToggle={() => toggleField("address")}
              >
                <label className={LABEL_CLS}>Address</label>
                <input type="text" value={card.address}
                  onChange={e => update("address", e.target.value)}
                  placeholder="Dubai, UAE" className={INPUT_CLS} />
              </ExpandableField>
            </SectionGroup>

            {/* ── SECTION: Social & Messaging ───────────────────────────── */}
            <SectionGroup title="Social & Messaging">
              {SOCIAL_FIELDS.map(({ key, Icon, iconBg, label, placeholder }) => (
                <ExpandableField
                  key={key}
                  id={key}
                  icon={
                    <div
                      className="flex h-full w-full items-center justify-center rounded-full"
                      style={{ backgroundColor: iconBg }}
                    >
                      <Icon size={15} color="#ffffff" />
                    </div>
                  }
                  label={label}
                  value={card[key] as string}
                  isOpen={openField === key}
                  onToggle={() => toggleField(key)}
                >
                  <label className={LABEL_CLS}>{label} URL</label>
                  <input
                    type="url"
                    value={card[key] as string}
                    onChange={e => setCard(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className={INPUT_CLS}
                  />
                </ExpandableField>
              ))}
            </SectionGroup>

            {/* ── SECTION: Custom CTAs ──────────────────────────────────── */}
            <SectionGroup title="Business">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-base border border-amber-100">
                      ⭐
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Custom Links / CTAs</p>
                      <p className="text-xs text-gray-400">Shown as buttons on your card</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addCL}
                    className="flex items-center gap-1.5 rounded-full border-2 border-dashed px-3 py-1.5 text-xs font-bold transition hover:opacity-80"
                    style={{ borderColor: BG, color: BP }}
                  >
                    + Add
                  </button>
                </div>

                <div className="space-y-3 p-4">
                  {card.customLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="grid flex-1 grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={link.title}
                          onChange={e => updateCL(i, "title", e.target.value)}
                          placeholder="Button label"
                          className={INPUT_CLS}
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={e => updateCL(i, "url", e.target.value)}
                          placeholder="https://…"
                          className={INPUT_CLS}
                        />
                      </div>
                      {card.customLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCL(i)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition hover:border-red-300 hover:text-red-500"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SectionGroup>

          </div>
        </main>

        {/* ─── RIGHT: Live Phone Preview (White, sticky) ───────────────────── */}
        <aside
          id="live-preview-panel"
          className="hidden xl:flex shrink-0 w-72 flex-col items-center justify-center gap-5 overflow-hidden"
          style={{
            height: "calc(100vh - 4rem)",
            position: "sticky",
            top: "4rem",
            backgroundColor: "#ffffff",
            borderLeft: "1px solid #e5e7eb",
            background:
              "linear-gradient(145deg, #f8f8f8 0%, #ffffff 50%, #f9fafb 100%)",
          }}
        >
          {/* Subtle decorative blobs */}
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full"
            style={{ background: `radial-gradient(circle, ${BG}12 0%, transparent 70%)` }}
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full"
            style={{ background: `radial-gradient(circle, ${BP}08 0%, transparent 70%)` }}
          />

          <p
            className="relative z-10 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400"
          >
            Live Preview
          </p>

          <div className="relative z-10">
            <PhonePreview card={card} />
          </div>

          <p className="relative z-10 text-[11px] text-gray-300">
            Updates in real-time as you type
          </p>
        </aside>

      </div>

      {/* ═══ FLOATING SAVE BUTTON ══════════════════════════════════════════════ */}
      <div className="pointer-events-none fixed bottom-0 z-50 flex justify-end px-6 py-5"
        style={{
          left: 0,
          right: 0,
          // On desktop, offset left by the sidebar width so button stays over form area
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
          style={{ background: "linear-gradient(to top, rgba(255,255,255,1) 60%, transparent)" }}
        />
        <button
          id="save-publish-btn"
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="pointer-events-auto relative flex items-center gap-2.5 rounded-2xl px-8 py-3.5 text-sm font-black transition-all duration-200 hover:scale-105 active:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: `linear-gradient(135deg, ${BGL} 0%, ${BG} 50%, #b8922a 100%)`,
            color: BP,
            boxShadow: `0 8px 32px ${BG}55, 0 20px 60px rgba(0,0,0,0.2)`,
          }}
        >
          {isPending ? (
            <>
              <Spinner />
              <span>{editingId ? "Updating…" : "Saving…"}</span>
            </>
          ) : (
            <>
              <span className="text-base">✦</span>
              <span>{editingId ? "Save Changes" : "Save & Publish"}</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMAGE UPLOAD BUTTON
═══════════════════════════════════════════════════════════════════════════ */

function ImageUploadBtn({
  label, icon, isUploading, imageUrl, onUpload, highlight = false,
}: {
  label: string;
  icon: string;
  isUploading: boolean;
  imageUrl?: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  highlight?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition-all relative overflow-hidden"
      style={{
        borderColor: highlight ? BG : "#e5e7eb",
        backgroundColor: highlight ? `${BG}08` : "#f9fafb",
        boxShadow: highlight ? `0 0 0 1px ${BG}30` : "none",
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={onUpload}
      />
      {imageUrl && !isUploading ? (
        <img
          src={imageUrl}
          alt={label}
          className="absolute inset-0 w-full h-full object-cover opacity-30 transition-opacity"
        />
      ) : null}

      <div className="relative z-10">
        {isUploading ? (
          <Spinner className="text-[#3d1313]" />
        ) : (
          <div className="text-2xl">{icon}</div>
        )}
      </div>
      <span
        className="relative z-10 text-[10px] font-bold uppercase"
        style={{ color: highlight ? BP : "#6b7280" }}
      >
        {isUploading ? "Uploading..." : label}
      </span>
      {highlight && (
        <div
          className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full"
          style={{ backgroundColor: BG }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PHONE PREVIEW — Gold-glowing frame
═══════════════════════════════════════════════════════════════════════════ */

function PhonePreview({ card }: { card: CardData }) {
  return (
    <div className="relative" style={{ width: 252, height: 516 }}>
      {/* Outer chrome frame with Luxury Gold border + glow */}
      <div
        className="absolute inset-0 rounded-[44px]"
        style={{
          background: "linear-gradient(160deg, #2c2c2c 0%, #111 100%)",
          border: "7px solid #1a1a1a",
          boxShadow: [
            `0 0 0 2px ${BG}`,
            `0 0 35px ${BG}55`,
            `0 0 70px ${BG}22`,
            "0 50px 100px rgba(0,0,0,0.7)",
            "0 20px 40px rgba(0,0,0,0.4)",
            "inset 0 1px 0 rgba(255,255,255,0.12)",
            "inset 0 -1px 0 rgba(0,0,0,0.5)",
          ].join(", "),
        }}
      >
        {/* Screen */}
        <div className="absolute inset-0 overflow-hidden rounded-[37px] bg-white">
          {/* Notch bar */}
          <div
            className="absolute left-1/2 top-0 z-20 -translate-x-1/2 rounded-b-3xl"
            style={{ width: 96, height: 26, backgroundColor: "#111" }}
          />
          {/* Camera dot */}
          <div
            className="absolute z-30 rounded-full"
            style={{ width: 10, height: 10, backgroundColor: "#222", top: 8, left: "50%", marginLeft: 22 }}
          />
          {/* Card content */}
          <div className="absolute inset-0 overflow-y-auto scrollbar-none">
            <CardInPhone card={card} compact={false} />
          </div>
        </div>
      </div>

      {/* Phone hardware buttons */}
      <div className="absolute rounded-r-sm" style={{ right: -9, top: 110, width: 5, height: 52, backgroundColor: "#222" }} />
      <div className="absolute rounded-l-sm" style={{ left: -9, top: 80,  width: 5, height: 34, backgroundColor: "#222" }} />
      <div className="absolute rounded-l-sm" style={{ left: -9, top: 124, width: 5, height: 34, backgroundColor: "#222" }} />
      <div className="absolute rounded-l-sm" style={{ left: -9, top: 62,  width: 5, height: 16, backgroundColor: "#222" }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CARD INSIDE PHONE
═══════════════════════════════════════════════════════════════════════════ */

function CardInPhone({ card, compact }: { card: CardData; compact: boolean }) {
  const isBusinessType = LOGO_TYPES.includes(card.profileType);
  const avatarSrc      = isBusinessType ? card.logoUrl : card.avatarUrl;
  const initial        = card.name ? card.name.charAt(0).toUpperCase() : "?";
  const coverH         = compact ? 72 : 108;
  const avatarS        = compact ? 48 : 64;
  const avatarOffset   = Math.floor(avatarS / 2);

  return (
    <div className="min-h-full w-full pb-6 relative bg-white">

      {/* Cover */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: coverH, backgroundColor: card.brandColor }}
      >
        {card.coverUrl && (
          <img src={card.coverUrl} className="absolute inset-0 w-full h-full object-cover" alt="Cover" />
        )}
        <div style={{ height: compact ? 0 : 26 }} />
      </div>

      {/* Avatar */}
      <div className="flex justify-center relative z-10" style={{ marginTop: -avatarOffset }}>
        <div
          className="flex items-center justify-center overflow-hidden rounded-full bg-white"
          style={{
            width: avatarS,
            height: avatarS,
            border: `3px solid ${BG}`,
            boxShadow: `0 4px 16px rgba(0,0,0,0.15), 0 0 0 2px white`,
          }}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt=""
              className="h-full w-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <span
              className="font-black"
              style={{ fontSize: compact ? 18 : 22, color: card.brandColor }}
            >
              {initial}
            </span>
          )}
        </div>
      </div>

      {/* Identity */}
      <div className="mt-2 px-4 text-center">
        <p className="font-black leading-tight" style={{ fontSize: compact ? 12 : 14, color: BP }}>
          {card.name || <span style={{ color: "#ccc" }}>Your Name</span>}
        </p>
        {card.jobTitle && (
          <p className="mt-0.5 text-gray-500" style={{ fontSize: compact ? 8 : 9 }}>
            {card.jobTitle}{card.company ? ` · ${card.company}` : ""}
          </p>
        )}
        {!card.jobTitle && card.company && (
          <p className="mt-0.5 font-bold" style={{ fontSize: compact ? 8 : 9, color: BG }}>
            {card.company}
          </p>
        )}
        {card.bio && !compact && (
          <p className="mx-2 mt-2 leading-relaxed text-gray-400" style={{ fontSize: 8 }}>
            {card.bio.length > 80 ? card.bio.slice(0, 80) + "…" : card.bio}
          </p>
        )}
      </div>

      {/* Gold divider */}
      {!compact && (
        <div
          className="mx-auto mt-3 h-px w-10 rounded-full"
          style={{ background: `linear-gradient(to right, transparent, ${BG}, transparent)` }}
        />
      )}

      {/* Action icon buttons */}
      {!compact && (card.phone || card.email || card.website || card.whatsapp) && (
        <div className="mt-4 flex justify-center gap-3 px-4 flex-wrap">
          {card.phone    && <PhoneBtn icon="📞" label="Call"  color={card.brandColor} />}
          {card.email    && <PhoneBtn icon="✉️" label="Email" color={card.brandColor} />}
          {card.website  && <PhoneBtn icon="🌐" label="Web"   color={card.brandColor} />}
          {card.whatsapp && <PhoneBtn icon="💬" label="Chat"  color={card.brandColor} />}
        </div>
      )}

      {/* Social divider */}
      {!compact && (card.linkedin || card.instagram || card.twitter || card.facebook || card.tiktok || card.telegram || card.youtube) && (
        <div className="mx-4 mt-4 border-t border-gray-100" />
      )}

      {/* Social dots */}
      {!compact && (card.linkedin || card.instagram || card.twitter || card.facebook || card.tiktok || card.telegram || card.youtube) && (
        <div className="mt-3 flex justify-center gap-2 px-4 flex-wrap">
          {card.linkedin  && <SocialDot Icon={FaLinkedinIn} bg={card.brandColor} />}
          {card.instagram && <SocialDot Icon={FaInstagram}  bg={card.brandColor} />}
          {card.twitter   && <SocialDot Icon={FaXTwitter}   bg={card.brandColor} />}
          {card.facebook  && <SocialDot Icon={FaFacebookF}  bg={card.brandColor} />}
          {card.youtube   && <SocialDot Icon={FaYoutube}    bg={card.brandColor} />}
          {card.tiktok    && <SocialDot Icon={FaTiktok}     bg={card.brandColor} />}
          {card.whatsapp  && <SocialDot Icon={FaWhatsapp}   bg={card.brandColor} />}
          {card.telegram  && <SocialDot Icon={FaTelegram}   bg={card.brandColor} />}
        </div>
      )}

      {/* Custom CTA buttons */}
      {!compact && (
        <div className="mt-4 space-y-2 px-4">
          {card.customLinks
            .filter(l => l.title)
            .map((link, i) => (
              <div
                key={i}
                className="w-full rounded-xl py-2.5 text-center"
                style={{
                  background: `linear-gradient(135deg, ${BGL} 0%, ${BG} 100%)`,
                  fontSize: 10,
                  fontWeight: 800,
                  color: BP,
                }}
              >
                {link.title}
              </div>
            ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center pb-4">
        <span style={{ fontSize: 7, color: "#bbb" }}>Powered by </span>
        <span style={{ fontSize: 7, fontWeight: 900, color: BG }}>DARIS NFC</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PHONE SUB-COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

function PhoneBtn({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full text-sm shadow-sm"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <span className="font-semibold text-gray-500" style={{ fontSize: 8 }}>{label}</span>
    </div>
  );
}

function SocialDot({
  Icon, bg,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  bg: string;
}) {
  return (
    <div
      className="flex h-7 w-7 items-center justify-center rounded-full shadow-sm"
      style={{ backgroundColor: bg }}
    >
      <Icon size={14} color="#ffffff" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FORM SUB-COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

function SectionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <h3 className="mb-3 px-0.5 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ExpandableField({
  id, icon, label, value, isOpen, onToggle, children,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50/80 focus:outline-none"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden text-base border border-gray-100"
          style={{ backgroundColor: "#f9fafb" }}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-sm font-semibold text-gray-800">{label}</span>
          {value && !isOpen && (
            <p className="mt-0.5 truncate text-xs text-gray-400">{value}</p>
          )}
        </div>

        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black transition-all duration-300"
          style={
            isOpen
              ? {
                  background: `linear-gradient(135deg, ${BGL} 0%, ${BG} 100%)`,
                  borderColor: BG,
                  color: BP,
                  transform: "rotate(45deg)",
                }
              : { borderColor: "#d1d5db", color: "#9ca3af" }
          }
        >
          +
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 bg-gray-50/40 px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cx("h-4 w-4 animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
