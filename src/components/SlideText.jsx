export default function SlideText({ children }) {
  return (
    <span className="slide-text">
      <span className="slide-text__primary">{children}</span>
      <span className="slide-text__secondary" aria-hidden="true">
        {children}
      </span>
    </span>
  );
}
