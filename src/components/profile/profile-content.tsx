"use client";

import { useState, useEffect } from "react";
import {
  User, Mail, Link as LinkIcon, Camera, Key, Check,
  Loader2, Copy, Facebook, AlertTriangle
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/context";

interface ProfileData {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  facebookUrl: string | null;
  memberCode: string;
}

export function ProfileContent() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data: ProfileData) => {
        setProfile(data);
        setName(data.name || "");
        setAvatarUrl(data.avatarUrl || "");
        setFacebookUrl(data.facebookUrl || "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl: avatarUrl || null, facebookUrl: facebookUrl || null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save");
      }
      setProfile((prev) => prev ? { ...prev, name, avatarUrl: avatarUrl || null, facebookUrl: facebookUrl || null } : prev);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange() {
    setPasswordError(null);
    if (newPassword.length < 8) { setPasswordError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"); return; }
    if (newPassword !== confirmPassword) { setPasswordError("รหัสผ่านไม่ตรงกัน"); return; }
    setPasswordLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => { setPasswordSuccess(false); setShowPasswordForm(false); }, 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setPasswordLoading(false);
    }
  }

  function copyMemberCode() {
    if (!profile?.memberCode) return;
    navigator.clipboard.writeText(profile.memberCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  const displayAvatar = avatarUrl || profile?.avatarUrl;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Avatar + Member Code */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 overflow-hidden flex items-center justify-center">
              {displayAvatar ? (
                <Image src={displayAvatar} alt="avatar" width={80} height={80} className="w-full h-full object-cover" unoptimized onError={() => setAvatarUrl("")} />
              ) : (
                <User className="w-8 h-8 text-emerald-400" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">{profile?.name || profile?.email?.split("@")[0]}</h2>
            <p className="text-sm text-zinc-400 mt-0.5">{profile?.email}</p>

            {/* Member Code */}
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Key className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-sm font-mono font-medium text-yellow-300">{profile?.memberCode}</span>
              <button
                onClick={copyMemberCode}
                className="ml-1 p-0.5 rounded text-yellow-400/60 hover:text-yellow-400 transition-colors"
                title="Copy member code"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-1">{t("profile.memberCodeDesc")}</p>
          </div>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-400" />
          {t("profile.editProfile")}
        </h3>

        {/* Name */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t("profile.displayName")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อที่แสดง"
            className={cn(
              "w-full px-3 py-2.5 rounded-lg text-sm bg-white/5 border border-white/10",
              "text-white placeholder-zinc-500 outline-none",
              "focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
            )}
          />
        </div>

        {/* Email — read only */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t("profile.email")}</label>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/3 border border-white/8 text-zinc-400 text-sm">
            <Mail className="w-4 h-4 shrink-0" />
            {profile?.email}
          </div>
        </div>

        {/* Avatar URL */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t("profile.avatarUrl")}</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className={cn(
                  "w-full pl-9 pr-3 py-2.5 rounded-lg text-sm bg-white/5 border border-white/10",
                  "text-white placeholder-zinc-500 outline-none",
                  "focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                )}
              />
            </div>
            {avatarUrl && (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                <Image src={avatarUrl} alt="preview" width={40} height={40} className="w-full h-full object-cover" unoptimized onError={() => {}} />
              </div>
            )}
          </div>
        </div>

        {/* Facebook URL */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t("profile.facebookUrl")}</label>
          <div className="relative">
            <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
            <input
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/username"
              className={cn(
                "w-full pl-9 pr-3 py-2.5 rounded-lg text-sm bg-white/5 border border-white/10",
                "text-white placeholder-zinc-500 outline-none",
                "focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              )}
            />
          </div>
          {facebookUrl && (
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1.5 text-xs text-blue-400 hover:underline">
              <LinkIcon className="w-3 h-3" />
              {t("profile.viewProfile")}
            </a>
          )}
        </div>

        {/* Save button */}
        {saveError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {saveError}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors",
            saveSuccess
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-emerald-500 hover:bg-emerald-600 text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4" /> : null}
          {saving ? t("profile.saving") : saveSuccess ? t("profile.saved") : t("profile.save")}
        </button>
      </div>

      {/* Password Change */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-yellow-400" />
            {t("profile.changePassword")}
          </h3>
          <button
            onClick={() => { setShowPasswordForm(!showPasswordForm); setPasswordError(null); }}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            {showPasswordForm ? t("profile.cancel") : t("profile.change")}
          </button>
        </div>

        {!showPasswordForm ? (
          <p className="text-sm text-zinc-500">{t("profile.passwordDesc")}</p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">{t("profile.newPassword")}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  "w-full px-3 py-2.5 rounded-lg text-sm bg-white/5 border border-white/10",
                  "text-white placeholder-zinc-500 outline-none",
                  "focus:border-yellow-500/40 focus:ring-1 focus:ring-yellow-500/20 transition-colors"
                )}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">{t("profile.confirmPassword")}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  "w-full px-3 py-2.5 rounded-lg text-sm bg-white/5 border border-white/10",
                  "text-white placeholder-zinc-500 outline-none",
                  "focus:border-yellow-500/40 focus:ring-1 focus:ring-yellow-500/20 transition-colors"
                )}
              />
            </div>

            {passwordError && (
              <div className="text-red-400 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="text-emerald-400 text-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {t("profile.passwordChanged")}
              </div>
            )}

            <button
              onClick={handlePasswordChange}
              disabled={passwordLoading || !newPassword || !confirmPassword}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors",
                "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              {t("profile.confirmChange")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
