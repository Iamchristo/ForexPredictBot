"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { tokenStorage } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(tokenStorage.getToken() ? "/dashboard" : "/login");
  }, [router]);

  return null;
}
