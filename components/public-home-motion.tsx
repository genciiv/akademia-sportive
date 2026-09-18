"use client";

import { useEffect } from "react";

export function PublicHomeMotion() {
  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      return;
    }

    const selectors = [
      "main > section:not(:first-of-type) > div",
      "#funksionet > div",
      "#planet .grid > div",
    ];

    const items = Array.from(
      new Set(
        selectors.flatMap((selector) =>
          Array.from(document.querySelectorAll<HTMLElement>(selector))
        )
      )
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const element = entry.target as HTMLElement;
          const delay = Number(element.dataset.homeMotionDelay ?? 0);

          const animation = element.animate(
            [
              {
                opacity: 0,
                transform: "translate3d(0, 14px, 0)",
              },
              {
                opacity: 1,
                transform: "translate3d(0, 0, 0)",
              },
            ],
            {
              duration: 560,
              delay,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "forwards",
            }
          );

          void animation.finished.finally(() => {
            element.style.opacity = "1";
            element.style.transform = "none";
            element.style.willChange = "auto";
          });

          observer.unobserve(element);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -5% 0px",
      }
    );

    items.forEach((element, index) => {
      element.style.opacity = "0";
      element.style.transform = "translate3d(0, 14px, 0)";
      element.style.willChange = "opacity, transform";
      element.dataset.homeMotionDelay = String((index % 4) * 45);

      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}