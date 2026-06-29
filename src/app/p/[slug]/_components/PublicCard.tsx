"use client";

import React from "react";
import type { Profile, ProfileType } from "@/types/profile";
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

const BURGUNDY = "#3d1313";
const GOLD     = "#d4af37";
const GOLD_LIGHT = "#e8c84a";

const LOGO_TYPES: ProfileType[] = ["business", "hotel", "restaurant", "legal"];

export default function PublicCard({ profile }: { profile: Profile }) {
  const ci = profile.contact_info;
  const brandColor = ci?.brand_color || BURGUNDY;
  const coverUrl = ci?.cover_url;
  const logoUrl = ci?.logo_url;
  const avatarUrl = profile.avatar_url;

  const isBusinessType = LOGO_TYPES.includes(profile.profile_type);
  const avatarSrc = isBusinessType ? logoUrl : avatarUrl;

  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : "?";

  return (
    <div className="min-h-screen w-full pb-36 font-sans bg-white relative">
      <div className="mx-auto max-w-md shadow-2xl sm:min-h-screen overflow-hidden relative bg-white pb-6">

        {/* ── COVER PHOTO — clean flat color or uploaded image ── */}
        <div
          className="relative h-48 w-full overflow-hidden"
          style={{ backgroundColor: brandColor }}
        >
          {coverUrl && (
            <img
              src={coverUrl}
              alt="Cover"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          )}
        </div>

        {/* ── AVATAR ── */}
        <div className="relative -mt-16 flex justify-center px-4">
          <div
            className="h-32 w-32 overflow-hidden rounded-full flex items-center justify-center relative z-10 bg-white"
            style={{
              border: `4px solid ${GOLD}`,
              boxShadow: `0 4px 16px rgba(0,0,0,0.15), 0 0 0 2px white`,
            }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-5xl font-black" style={{ color: brandColor }}>
                {initial}
              </span>
            )}
          </div>
        </div>

        {/* ── IDENTITY ── */}
        <div className="mt-4 px-6 text-center">
          <h1 className="text-3xl font-black tracking-tight" style={{ color: BURGUNDY }}>
            {profile.name}
          </h1>

          {(ci?.job_title || ci?.company) && (
            <p className="mt-1 text-sm text-gray-500">
              {ci.job_title}
              {ci.job_title && ci.company ? " · " : ""}
              {ci.company && <span className="font-bold" style={{ color: GOLD }}>{ci.company}</span>}
            </p>
          )}

          {/* Gold divider */}
          <div
            className="mx-auto mt-4 mb-4 h-px w-16 rounded-full"
            style={{ background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }}
          />

          {profile.bio && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-600 px-2">
              {profile.bio}
            </p>
          )}
        </div>

        {/* ── CONTACT PILLS ── */}
        <div className="mt-8 flex justify-center gap-5 px-6 flex-wrap">
          {ci?.phone && <PhoneBtn href={`tel:${ci.phone}`} icon="📞" label="Call" color={brandColor} />}
          {ci?.email && <PhoneBtn href={`mailto:${ci.email}`} icon="✉️" label="Email" color={brandColor} />}
          {ci?.website && <PhoneBtn href={ci.website} icon="🌐" label="Web" color={brandColor} />}
        </div>

        {/* ── SOCIAL LINKS ── */}
        {profile.social_links && profile.social_links.length > 0 && (
          <div className="mt-8 px-6">
            <div className="border-t border-gray-100 mb-6" />
            <div className="flex justify-center gap-4 flex-wrap">
              {profile.social_links.map((link, i) => {
                const p = link.platform.toLowerCase();
                let Icon = FaFacebookF;
                let bg = "#1877f2";

                if (p.includes("linkedin"))   { Icon = FaLinkedinIn; bg = "#0a66c2"; }
                else if (p.includes("instagram")) { Icon = FaInstagram; bg = "#e1306c"; }
                else if (p.includes("twitter") || p.includes("x")) { Icon = FaXTwitter; bg = "#000000"; }
                else if (p.includes("facebook"))  { Icon = FaFacebookF; bg = "#1877f2"; }
                else if (p.includes("youtube"))   { Icon = FaYoutube; bg = "#ff0000"; }
                else if (p.includes("tiktok"))    { Icon = FaTiktok; bg = "#010101"; }
                else if (p.includes("whatsapp"))  { Icon = FaWhatsapp; bg = "#25d366"; }
                else if (p.includes("telegram"))  { Icon = FaTelegram; bg = "#229ed9"; }

                return (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-12 items-center justify-center rounded-full shadow-sm transition-transform hover:scale-110"
                    style={{ backgroundColor: bg }}
                    title={link.platform}
                  >
                    <Icon size={22} color="#ffffff" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CUSTOM CTAS ── */}
        {profile.custom_links && profile.custom_links.length > 0 && (
          <div className="mt-8 px-6 space-y-3">
            {profile.custom_links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-black transition-transform hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
                  color: BURGUNDY,
                  boxShadow: `0 4px 14px ${GOLD}33`,
                }}
              >
                {link.title}
              </a>
            ))}
          </div>
        )}

        {/* Powered-by footer */}
        <div className="mt-10 mb-4 text-center">
          <span style={{ fontSize: 10, color: "#bbb" }}>Powered by </span>
          <span style={{ fontSize: 10, fontWeight: 900, color: GOLD }}>DARIS NFC</span>
        </div>

        {/* SPACER FOR STICKY BUTTON */}
        <div className="h-20" />
      </div>
    </div>
  );
}

function PhoneBtn({ icon, label, color, href }: { icon: string; label: string; color: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group transition-transform hover:scale-105">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full shadow-sm text-2xl group-hover:shadow-md transition-shadow"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <span className="font-semibold text-gray-500 text-xs uppercase tracking-wide">
        {label}
      </span>
    </a>
  );
}
