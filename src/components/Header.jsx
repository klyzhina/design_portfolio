import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import MobileMenu from "./MobileMenu";

const navigationLinks = [
  { label: "Works", to: "/#works" },
  { label: "Contacts", to: { hash: "#contacts" } },
];

function MenuToggle({ isOpen, onClick, buttonRef }) {
  return (
    <button
      ref={buttonRef}
      className={`menu-toggle${isOpen ? " menu-toggle--open" : ""}`}
      data-focus-id="mobile-menu-toggle"
      type="button"
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      aria-controls="mobile-navigation"
    >
      <span className="menu-toggle__burger" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="menu-toggle__close" aria-hidden="true">
        <span />
        <span />
      </span>
    </button>
  );
}

function MobileNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  return (
    <>
      <MenuToggle
        isOpen={isMenuOpen}
        onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        buttonRef={menuButtonRef}
      />
      <MobileMenu
        isOpen={isMenuOpen}
        links={navigationLinks}
        onClose={closeMenu}
        returnFocusRef={menuButtonRef}
      />
    </>
  );
}

export default function Header() {
  const isMobile = useIsMobile();

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <div className="site-header__inner container">
        <Link
          className="menu-text site-header__brand"
          to="/"
          data-focus-id="site-brand"
        >
          Kseniia Lyzhina
        </Link>

        {isMobile ? (
          <MobileNavigation />
        ) : (
          <nav className="site-header__nav" aria-label="Primary navigation">
            {navigationLinks.map(({ label, to }) => (
              <Link
                className="menu-text site-header__nav-link"
                key={label}
                to={to}
                data-focus-id={`primary-${label.toLowerCase()}`}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
