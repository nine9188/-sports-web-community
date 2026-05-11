"use client";

import { useEffect } from "react";

export default function PostHashScroller() {
  useEffect(() => {
    if (!window.location.hash) return;

    const hashId = window.location.hash.substring(1);
    const timeoutId = window.setTimeout(() => {
      const element = document.getElementById(hashId);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return null;
}
