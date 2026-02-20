import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "New Quiz", icon: "ri-question-answer-line" },
  { href: "/give-exam", label: "Give Exam", icon: "ri-pencil-ruler-2-line" },
  { href: "/my-quizzes", label: "My Quizzes", icon: "ri-file-list-3-line" },
  { href: "/leaderboard", label: "Leaderboard", icon: "ri-medal-line" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { pathname } = useLocation();

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full z-30 flex flex-col transition-all duration-300 ease-in-out",
        "glass border-r border-white/[0.06]",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/[0.06]">
        {!collapsed && (
          <span className="gradient-text font-bold text-lg tracking-widest select-none">
            SISIMPUR
          </span>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            "text-white/50 hover:text-white hover:bg-white/10 transition",
            collapsed && "mx-auto"
          )}
        >
          <i className={cn(collapsed ? "ri-arrow-right-s-line" : "ri-arrow-left-s-line", "text-lg")} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-purple-600/25 text-purple-300 border border-purple-500/30"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.06]"
              )}
            >
              <i className={cn(item.icon, "text-xl shrink-0")} />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="px-2 py-4 border-t border-white/[0.06] space-y-1">
        {[
          { href: "/profile", icon: "ri-user-line", label: "Profile" },
          { href: "/settings", icon: "ri-settings-3-line", label: "Settings" },
          { href: "/help", icon: "ri-question-line", label: "Help" },
        ].map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl transition",
              "text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
            )}
          >
            <i className={cn(item.icon, "text-lg shrink-0")} />
            {!collapsed && <span className="text-sm truncate">{item.label}</span>}
          </Link>
        ))}
      </div>
    </aside>
  );
}
