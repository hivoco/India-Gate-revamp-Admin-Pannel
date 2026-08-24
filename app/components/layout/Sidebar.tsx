"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  HelpCircle,
  UserCog,
  ChefHat,
  Search,
  House,
  UserRound,
  PanelLeftClose,
  PanelLeftOpen,
  // AtSign,
} from "lucide-react";
import { useSyncExternalStore } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  subscribeSidebar,
  getSidebarCollapsed,
  getSidebarServerSnapshot,
  setSidebarCollapsed,
} from "@/app/lib/utils/sidebar-store";
import { canAccessSection } from "@/app/lib/constants/admin-sections";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    getSidebarCollapsed,
    getSidebarServerSnapshot,
  );

  const allLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "dashboard" },
    { to: "/contacts", label: "Contacts", icon: MessageSquare, section: "contacts" },
    { to: "/blogs", label: "Blogs", icon: FileText, section: "blogs" },
    { to: "/faqs", label: "FAQs", icon: HelpCircle, section: "faqs" },
    { to: "/recipes", label: "Recipes", icon: ChefHat, section: "recipes" },
    { to: "/seo", label: "Page SEO", icon: Search, section: "seo" },
    { to: "/site", label: "Home & Footer", icon: House, section: "settings" },
    // { to: "/insta-posts", label: "Insta Posts", icon: AtSign },
  ];

  // an admin only sees the sections it was given. this is presentation only,
  // the api enforces the same thing on every request
  const links = allLinks.filter((link) =>
    canAccessSection(user?.role ?? "admin", user?.permissions, link.section),
  );

  if (user?.role === "superadmin") {
    links.push({
      to: "/admins",
      label: "Admins",
      icon: UserCog,
      section: "admins",
    });
  }

  // everyone gets this one, it is where an account changes its own password
  links.push({
    to: "/profile",
    label: "My Account",
    icon: UserRound,
    section: "profile",
  });

  return (
    <aside
      className={`bg-[#672E1F] h-screen text-white flex flex-col sticky top-0 shrink-0 transition-[width] duration-200 ease-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div
        className={`flex items-center border-b border-white/20 min-h-[76px] ${
          collapsed ? "justify-center px-2" : "gap-2 px-4"
        }`}
      >
        {!collapsed && (
          <span className="text-xl font-bold leading-tight">
            India Gate Basmati Rice
          </span>
        )}

        <button
          type="button"
          onClick={() => setSidebarCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="shrink-0 grid size-9 place-items-center rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
        >
          {collapsed ? (
            <PanelLeftOpen size={20} />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            href={to}
            // the label is the tooltip while collapsed, since the icon alone
            // does not say where a link goes
            title={collapsed ? label : undefined}
            className={`flex items-center rounded-lg transition-colors ${
              collapsed ? "justify-center px-2 py-3" : "gap-4 px-4 py-3"
            } ${
              pathname === to
                ? "bg-white/20 font-semibold"
                : "text-white hover:bg-white/20"
            }`}
          >
            <Icon size={20} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}