import { useEffect, useRef } from "react";

export function useReveal(direction: "up" | "left" | "right" = "up") {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Apply correct reveal class
    const cls = direction === "left" ? "reveal-left" : direction === "right" ? "reveal-right" : "reveal";
    if (!el.classList.contains(cls)) el.classList.add(cls);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [direction]);

  return ref;
}
