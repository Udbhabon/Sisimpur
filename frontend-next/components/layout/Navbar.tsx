"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, clearAuth } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      clearAuth();
      router.push("/signin");
    } catch {
      toast("Logout failed", "error");
    }
  }

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/[0.06] glass sticky top-0 z-20">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          <i className="ri-menu-line text-xl" />
        </button>

        <div className="relative hidden md:flex items-center">
          <i className="ri-search-line absolute left-3 text-white/30 text-sm" />
          <input
            type="text"
            placeholder="Search topics, quizzes…"
            className={cn(
              "bg-white/[0.05] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2",
              "text-sm text-white/80 placeholder:text-white/30 outline-none",
              "focus:border-purple-500/50 focus:bg-white/[0.08] transition w-64"
            )}
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <Link
          href="/give-exam"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
            bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition"
        >
          <i className="ri-pencil-ruler-2-line" />
          <span>Give Exam</span>
        </Link>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((p) => !p)}
            className="w-9 h-9 rounded-full flex items-center justify-center
              bg-gradient-to-br from-purple-500 to-blue-500 text-white font-semibold text-sm
              hover:opacity-90 transition select-none"
          >
            {user?.username?.[0]?.toUpperCase() ?? "U"}
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-52 glass border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-sm font-medium text-white truncate">
                  {user?.username ?? "User"}
                </p>
                <p className="text-xs text-white/40 truncate">{user?.email ?? ""}</p>
              </div>
              <div className="p-2 space-y-1">
                {[
                  { href: "/profile", icon: "ri-user-line", label: "Profile" },
                  { href: "/settings", icon: "ri-settings-3-line", label: "Settings" },
                  { href: "/help", icon: "ri-question-line", label: "Help" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60
                      hover:text-white hover:bg-white/[0.06] transition"
                  >
                    <i className={item.icon} />
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400
                    hover:bg-red-500/10 transition"
                >
                  <i className="ri-logout-box-r-line" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
