import { Link } from "react-router-dom";
import SlideText from "./SlideText";

export default function ProjectCard({ project, priority = false }) {
  const { cover, destination, title, type, year } = project;
  const isExternal = destination.kind === "external";
  const CardLink = isExternal ? "a" : Link;
  const linkProps = isExternal
    ? {
        href: destination.href,
        target: "_blank",
        rel: "noopener noreferrer",
        "aria-label": `${title}${type ? `, ${type}` : ""}, ${year}. Visit website (opens in a new tab)`,
      }
    : { to: destination.to };

  return (
    <article className="project-card" aria-labelledby={`project-${project.id}`}>
      <CardLink
        className="project-card__link"
        data-focus-id={`project-${project.id}`}
        {...linkProps}
      >
        <div className="project-card__media">
          <img
            className="project-card__image"
            src={cover.src}
            srcSet={cover.srcSet}
            sizes="(max-width: 768px) calc(100vw - 40px), (min-width: 1440px) 1340px, calc(100vw - 100px)"
            alt={cover.alt}
            width={cover.width}
            height={cover.height}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
          />
        </div>

        <div className="project-card__footer">
          <div className="body-copy project-card__details">
            <h2 id={`project-${project.id}`} className="project-card__title">
              {title}
            </h2>
            {type && <div>{type}</div>}
            <div>({year})</div>
          </div>

          <span className="body-copy project-card__cta">
            <SlideText>{isExternal ? "Visit website" : "Open case"}</SlideText>
          </span>
        </div>
      </CardLink>
    </article>
  );
}
