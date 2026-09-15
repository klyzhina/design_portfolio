import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const LENIS_MEDIA_QUERY =
  "(min-width: 769px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

function cancelLenisFrame(lenisRef, lenisFrameRef) {
  if (lenisFrameRef.current !== null) {
    cancelAnimationFrame(lenisFrameRef.current);
    lenisFrameRef.current = null;
  }

  const lenis = lenisRef.current;
  if (lenis) {
    lenis.stop();
    lenis.start();
  }
}

function cancelActiveScroll(lenisRef, lenisFrameRef) {
  const left = window.scrollX;
  const top = window.scrollY;

  cancelLenisFrame(lenisRef, lenisFrameRef);
  window.scrollTo({ left, top, behavior: "instant" });
}

function getUnmodifiedInternalLink(event) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    !(event.target instanceof Element)
  ) {
    return null;
  }

  const link = event.target.closest("a[href]");
  if (
    !link ||
    link.hasAttribute("download") ||
    (link.target && link.target !== "_self")
  ) {
    return null;
  }

  const destination = new URL(link.href, window.location.href);
  return destination.origin === window.location.origin ? link : null;
}

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function getResolvedHref(link) {
  const destination = new URL(link.href, window.location.href);
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

function getStoredValue(storageKey) {
  try {
    return sessionStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function storeValue(storageKey, value) {
  try {
    sessionStorage.setItem(storageKey, value);
  } catch {
    // Scroll and focus restoration are enhancements when storage is unavailable.
  }
}

function saveFocusOrigin(storageKey, link) {
  const origin = {
    focusId: link.dataset.focusId || null,
    fallbackFocusId: link.dataset.focusFallbackId || null,
    href: getResolvedHref(link),
    text: normalizeText(link.textContent || ""),
  };

  storeValue(storageKey, JSON.stringify(origin));
}

function isAvailableFocusTarget(element) {
  if (!(element instanceof HTMLElement) || element.closest("[inert]")) {
    return false;
  }

  const styles = window.getComputedStyle(element);
  return styles.display !== "none" && styles.visibility !== "hidden";
}

function findByFocusId(focusId) {
  if (!focusId) {
    return null;
  }

  return (
    [...document.querySelectorAll("[data-focus-id]")].find(
      (element) =>
        element.dataset.focusId === focusId &&
        isAvailableFocusTarget(element)
    ) ?? null
  );
}

function findStoredFocusOrigin(storageKey) {
  let origin;

  try {
    origin = JSON.parse(getStoredValue(storageKey));
  } catch {
    return null;
  }

  if (!origin || typeof origin !== "object") {
    return null;
  }

  const identifiedTarget = findByFocusId(origin.focusId);
  if (identifiedTarget) {
    return identifiedTarget;
  }

  if (typeof origin.href === "string") {
    const matchingLinks = [...document.querySelectorAll("a[href]")].filter(
      (link) =>
        isAvailableFocusTarget(link) && getResolvedHref(link) === origin.href
    );
    const textMatch = matchingLinks.find(
      (link) => normalizeText(link.textContent || "") === origin.text
    );

    if (textMatch) {
      return textMatch;
    }

    if (matchingLinks.length === 1) {
      return matchingLinks[0];
    }
  }

  return findByFocusId(origin.fallbackFocusId);
}

function findVisibleMainTarget() {
  const main = document.getElementById("main-content");
  if (!main) {
    return null;
  }

  const headerBottom =
    document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0;
  const probeY = Math.min(window.innerHeight - 1, Math.max(0, headerBottom + 16));
  const hitTarget = document
    .elementFromPoint(window.innerWidth / 2, probeY)
    ?.closest("a[href], button:not([disabled]), h1, h2, h3, [role='heading']");

  if (hitTarget && main.contains(hitTarget) && isAvailableFocusTarget(hitTarget)) {
    return hitTarget;
  }

  const candidates = [
    ...main.querySelectorAll(
      "a[href], button:not([disabled]), h1, h2, h3, [role='heading']"
    ),
  ].filter((element) => {
    if (!isAvailableFocusTarget(element)) {
      return false;
    }

    const bounds = element.getBoundingClientRect();
    return bounds.bottom > headerBottom && bounds.top < window.innerHeight;
  });

  return (
    candidates.sort((first, second) => {
      const firstDistance = Math.abs(
        first.getBoundingClientRect().top - probeY
      );
      const secondDistance = Math.abs(
        second.getBoundingClientRect().top - probeY
      );
      return firstDistance - secondDistance;
    })[0] ?? main
  );
}

function isInVisibleViewport(element) {
  if (!isAvailableFocusTarget(element)) {
    return false;
  }

  const headerBottom =
    document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0;
  const bounds = element.getBoundingClientRect();
  if (element.closest(".site-header")) {
    return bounds.bottom > 0 && bounds.top < window.innerHeight;
  }

  return bounds.bottom > headerBottom && bounds.top < window.innerHeight;
}

function focusElement(element, preventScroll) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const isNativelyFocusable = element.matches(
    "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]"
  );

  if (!isNativelyFocusable) {
    element.setAttribute("tabindex", "-1");
    element.addEventListener(
      "blur",
      () => {
        if (element.getAttribute("tabindex") === "-1") {
          element.removeAttribute("tabindex");
        }
      },
      { once: true }
    );
  }

  element.focus({ preventScroll });
  return document.activeElement === element;
}

export default function ScrollCoordinator() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollStorageKey = `scroll:${location.pathname}:${location.key}`;
  const focusStorageKey = `focus:${location.key}`;
  const focusStorageKeyRef = useRef(focusStorageKey);
  const lenisRef = useRef(null);
  const lenisFrameRef = useRef(null);
  const requestLenisFrameRef = useRef(null);
  const previousPathnameRef = useRef(null);

  useLayoutEffect(() => {
    focusStorageKeyRef.current = focusStorageKey;
  }, [focusStorageKey]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(LENIS_MEDIA_QUERY);
    let disposed = false;
    let importGeneration = 0;
    let removeVirtualScrollListener;

    const destroyLenis = () => {
      importGeneration += 1;

      if (lenisFrameRef.current !== null) {
        cancelAnimationFrame(lenisFrameRef.current);
        lenisFrameRef.current = null;
      }

      requestLenisFrameRef.current = null;
      removeVirtualScrollListener?.();
      removeVirtualScrollListener = undefined;

      if (lenisRef.current) {
        lenisRef.current.stop();
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
    };

    const createLenis = async () => {
      if (lenisRef.current) {
        return;
      }

      const generation = ++importGeneration;
      const { default: Lenis } = await import("lenis");

      if (disposed || generation !== importGeneration || !mediaQuery.matches) {
        return;
      }

      const lenis = new Lenis({
        autoRaf: false,
        duration: 1.2,
        smoothWheel: true,
      });

      const requestLenisFrame = () => {
        if (lenisFrameRef.current !== null) {
          return;
        }

        lenis.time = performance.now();
        lenisFrameRef.current = requestAnimationFrame((time) => {
          lenisFrameRef.current = null;
          lenis.raf(time);

          if (lenis.isScrolling === "smooth") {
            requestLenisFrame();
          }
        });
      };

      lenisRef.current = lenis;
      requestLenisFrameRef.current = requestLenisFrame;
      removeVirtualScrollListener = lenis.on(
        "virtual-scroll",
        requestLenisFrame
      );
    };

    const syncLenis = () => {
      if (mediaQuery.matches) {
        void createLenis();
      } else {
        destroyLenis();
      }
    };

    syncLenis();
    mediaQuery.addEventListener("change", syncLenis);

    return () => {
      disposed = true;
      mediaQuery.removeEventListener("change", syncLenis);
      destroyLenis();
    };
  }, []);

  useEffect(() => {
    const cancelBeforeNavigation = (event) => {
      const link = getUnmodifiedInternalLink(event);
      if (!link) {
        return;
      }

      saveFocusOrigin(focusStorageKeyRef.current, link);
      cancelActiveScroll(lenisRef, lenisFrameRef);
    };

    document.addEventListener("click", cancelBeforeNavigation, true);
    return () =>
      document.removeEventListener("click", cancelBeforeNavigation, true);
  }, []);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    const previousPathname = previousPathnameRef.current;
    const isInitialRender = previousPathname === null;
    const pathnameChanged =
      isInitialRender || previousPathname !== location.pathname;
    const isPopNavigation = navigationType === "POP";
    const targetId = location.hash.slice(1);
    const target = targetId ? document.getElementById(targetId) : null;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const savedPosition = isPopNavigation
      ? getStoredValue(scrollStorageKey)
      : null;
    const parsedSavedPosition = Number(savedPosition);
    const hasSavedPosition =
      savedPosition !== null && Number.isFinite(parsedSavedPosition);
    const lenis = lenisRef.current;

    previousPathnameRef.current = location.pathname;
    cancelActiveScroll(lenisRef, lenisFrameRef);
    lenis?.resize();

    const scrollImmediately = (destination) => {
      if (lenis) {
        lenis.scrollTo(destination, { immediate: true, force: true });
      } else if (destination instanceof HTMLElement) {
        destination.scrollIntoView({ behavior: "instant", block: "start" });
      } else {
        window.scrollTo({ left: 0, top: destination, behavior: "instant" });
      }
    };

    if (hasSavedPosition) {
      scrollImmediately(parsedSavedPosition);
    } else if (target) {
      const shouldScrollSmoothly =
        !pathnameChanged && !isPopNavigation && !prefersReducedMotion;

      if (shouldScrollSmoothly && lenis) {
        lenis.scrollTo(target);
        requestLenisFrameRef.current?.();
      } else if (shouldScrollSmoothly) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        scrollImmediately(target);
      }

      if (!isPopNavigation && location.key !== "default") {
        target.focus({ preventScroll: true });
      }
    } else {
      scrollImmediately(0);

      if (!isPopNavigation && location.key !== "default") {
        document
          .querySelector("#main-content h1")
          ?.focus({ preventScroll: true });
      }
    }

    if (isPopNavigation && !isInitialRender) {
      const origin = findStoredFocusOrigin(focusStorageKey);
      const focusTarget =
        origin && (!hasSavedPosition || isInVisibleViewport(origin))
          ? origin
          : findVisibleMainTarget();
      focusElement(focusTarget, hasSavedPosition);
    }
  }, [
    focusStorageKey,
    location.hash,
    location.key,
    location.pathname,
    navigationType,
    scrollStorageKey,
  ]);

  useLayoutEffect(() => {
    const savePosition = () => {
      storeValue(scrollStorageKey, String(window.scrollY));
    };

    window.addEventListener("pagehide", savePosition);

    return () => {
      window.removeEventListener("pagehide", savePosition);
      savePosition();
    };
  }, [scrollStorageKey]);

  return null;
}
