"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isTokenExpired } from "./lib/utils/session";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    // an expired token still sits in localStorage, so checking for its
    // presence alone would send someone to a dashboard that 401s
    if (token && !isTokenExpired(token)) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null;
}