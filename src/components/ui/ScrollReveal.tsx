"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  staggerIndex?: number;
  staggerDelayMs?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  durationMs?: number;
  distancePx?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  className = "",
  staggerIndex = 0,
  staggerDelayMs = 90,
  direction = "up",
  durationMs = 500,
  distancePx = 24,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Honor reduced motion accessibility preferences
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && node) {
            observer.unobserve(node);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    observer.observe(node);

    return () => {
      if (node) observer.unobserve(node);
    };
  }, [once]);

  const delayMs = staggerIndex * staggerDelayMs;

  const getTransform = () => {
    if (isVisible) return "translate3d(0, 0, 0)";
    switch (direction) {
      case "up":
        return `translate3d(0, ${distancePx}px, 0)`;
      case "down":
        return `translate3d(0, -${distancePx}px, 0)`;
      case "left":
        return `translate3d(${distancePx}px, 0, 0)`;
      case "right":
        return `translate3d(-${distancePx}px, 0, 0)`;
      case "none":
        return "translate3d(0, 0, 0)";
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transitionProperty: "opacity, transform",
        transitionDuration: `${durationMs}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delayMs}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
