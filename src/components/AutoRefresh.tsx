"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches server data periodically so lists stay current without a manual reload. */
export default function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
