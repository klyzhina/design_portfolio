import SlideText from "./SlideText";

const contactLinks = [
  { label: "Email", href: "mailto:kseniialyzhina@gmail.com" },
  {
    label: "Linkedin",
    href: "https://www.linkedin.com/in/kseniialyzhina/",
    external: true,
  },
  { label: "Telegram", href: "https://t.me/prvrd", external: true },
];

export default function Footer() {
  return (
    <footer
      id="contacts"
      className="site-footer"
      tabIndex={-1}
      aria-label="Contact Kseniia Lyzhina"
    >
      <div className="site-footer__grid container">
        <span className="body-copy site-footer__meta">Kseniia Lyzhina</span>

        <div className="site-footer__links">
          {contactLinks.map(({ label, href, external }) => (
            <a
              className="display-heading site-footer__link slide-link"
              key={label}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              aria-label={
                external ? `${label} (opens in a new tab)` : undefined
              }
            >
              <SlideText>{label}</SlideText>
            </a>
          ))}
        </div>

        <span className="body-copy site-footer__meta site-footer__meta--right">
          Graphic designer
        </span>
      </div>
    </footer>
  );
}
