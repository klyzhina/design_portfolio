import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

export default function MobileMenu({
  isOpen,
  links,
  onClose,
  returnFocusRef,
}) {
  const menuRef = useRef(null);
  const shouldReturnFocusRef = useRef(true);

  useLayoutEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const appRoot = document.getElementById("root");
    const rootWasInert = appRoot?.hasAttribute("inert") ?? false;
    const previousRootAriaHidden = appRoot?.getAttribute("aria-hidden") ?? null;
    const returnFocusTarget = returnFocusRef.current;
    const focusableElements = [
      ...menuRef.current.querySelectorAll("button:not([disabled]), a[href]"),
    ];
    const firstFocusable = focusableElements[0];
    const firstLink = menuRef.current.querySelector("a[href]");
    const lastFocusable = focusableElements.at(-1);

    shouldReturnFocusRef.current = true;
    firstLink?.focus();
    document.body.style.overflow = "hidden";
    if (appRoot) {
      appRoot.setAttribute("inert", "");
      appRoot.setAttribute("aria-hidden", "true");
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || focusableElements.length === 0) {
        return;
      }

      if (!menuRef.current.contains(document.activeElement)) {
        event.preventDefault();
        firstFocusable.focus();
      } else if (
        event.shiftKey &&
        document.activeElement === firstFocusable
      ) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastFocusable
      ) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (appRoot) {
        if (!rootWasInert) {
          appRoot.removeAttribute("inert");
        }

        if (previousRootAriaHidden === null) {
          appRoot.removeAttribute("aria-hidden");
        } else {
          appRoot.setAttribute("aria-hidden", previousRootAriaHidden);
        }
      }

      if (shouldReturnFocusRef.current && returnFocusTarget?.isConnected) {
        returnFocusTarget.focus();
      }
    };
  }, [isOpen, onClose, returnFocusRef]);

  const closeForNavigation = () => {
    shouldReturnFocusRef.current = false;
    onClose();
  };

  return createPortal(
    <div
      ref={menuRef}
      id="mobile-navigation"
      className={`mobile-menu${isOpen ? " mobile-menu--open" : ""}`}
      role="dialog"
      aria-label="Site navigation"
      aria-modal="true"
      aria-hidden={!isOpen}
      inert={isOpen ? undefined : "inert"}
      data-lenis-prevent
    >
      <button
        className="menu-toggle menu-toggle--open mobile-menu__close"
        type="button"
        onClick={onClose}
        aria-label="Close menu"
      >
        <span className="menu-toggle__close" aria-hidden="true">
          <span />
          <span />
        </span>
      </button>

      <nav className="mobile-menu__links" aria-label="Mobile navigation">
        {links.map(({ label, to }) => (
          <Link
            className="menu-text mobile-menu__link"
            key={label}
            to={to}
            onClick={closeForNavigation}
            data-focus-id={`mobile-${label.toLowerCase()}`}
            data-focus-fallback-id="mobile-menu-toggle"
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>,
    document.body
  );
}
