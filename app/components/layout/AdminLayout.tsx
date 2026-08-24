"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import Sidebar from "./Sidebar";
import Header from "./Header";
import {
  subscribeAuthStore,
  getAuthToken,
  getStoredUser,
  getServerSnapshot,
  clearAuth,
} from "@/app/lib/utils/auth-store";
import {
  ADMIN_SECTIONS,
  canAccessSection,
} from "@/app/lib/constants/admin-sections";
import { getTokenExpiry, isTokenExpired } from "@/app/lib/utils/session";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  // drives the render. the server snapshot is null because localStorage does
  // not exist there, so this is null for the hydration pass and resolves on
  // the re-render right after
  const token = useSyncExternalStore(
    subscribeAuthStore,
    getAuthToken,
    getServerSnapshot,
  );

  useEffect(() => {
    // read the store rather than the synced value. effects run on the client,
    // where localStorage is readable, and on the hydration pass the synced
    // value is still the null server snapshot. redirecting off that is what
    // used to log an admin out on every reload
    const stored = getAuthToken();

    if (!stored || isTokenExpired(stored)) {
      clearAuth();
      router.replace("/login");
      return;
    }

    const expiry = getTokenExpiry(stored);

    if (expiry === null) return;

    // log out the moment the token lapses rather than leaving someone on a
    // panel where every request has quietly started failing
    const timer = setTimeout(
      () => {
        clearAuth();
        router.replace("/login");
      },
      Math.max(0, expiry - Date.now()),
    );

    return () => clearTimeout(timer);
  }, [token, router]);

  // typing a url is not a way around the sidebar. the api refuses the data
  // either way, this just avoids landing on a page that only renders errors
  useEffect(() => {
    const user = getStoredUser();

    if (!user) return;

    const section = ADMIN_SECTIONS.find(
      (candidate) =>
        pathname === candidate.path || pathname.startsWith(`${candidate.path}/`),
    );

    if (!section) return;

    if (canAccessSection(user.role, user.permissions, section.key)) return;

    // send them somewhere they can actually use, their own account page is
    // the one every role always has
    const firstAllowed = ADMIN_SECTIONS.find((candidate) =>
      canAccessSection(user.role, user.permissions, candidate.key),
    );

    router.replace(firstAllowed ? firstAllowed.path : "/profile");
  }, [pathname, token, router]);

  if (!token || isTokenExpired(token)) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F6F3]">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Header />

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
