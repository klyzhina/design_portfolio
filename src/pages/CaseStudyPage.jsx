import { Link } from "react-router-dom";
import ProjectGallery from "../components/ProjectGallery";
import SlideText from "../components/SlideText";
import { portfolioById } from "../data/portfolio";

function CopyBlock({
  title,
  body,
  isIntro = false,
  headingLevel = 2,
  headingPrefix,
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const Wrapper = isIntro ? "header" : title ? "section" : "div";

  return (
    <Wrapper className="project-copy container">
      {title && (
        <Heading
          className="display-heading"
          tabIndex={headingLevel === 1 ? -1 : undefined}
        >
          {headingPrefix && (
            <span className="visually-hidden">{headingPrefix}</span>
          )}
          {title}
        </Heading>
      )}
      {body && <p className="body-copy project-copy__body">{body}</p>}
    </Wrapper>
  );
}

export default function CaseStudyPage({ project }) {
  const { pageTitle, intro, blocks, nextProjectId } = project.caseStudy;
  const nextProject = portfolioById[nextProjectId];
  const introIsPageTitle = intro.title === pageTitle;
  const firstGalleryIndex = blocks.findIndex(
    (block) => block.kind === "gallery"
  );

  return (
    <article className="case-study">
      <CopyBlock
        {...intro}
        isIntro
        headingLevel={1}
        headingPrefix={introIsPageTitle ? undefined : `${pageTitle}: `}
      />

      {blocks.map((block, index) =>
        block.kind === "gallery" ? (
          <ProjectGallery
            key={block.images[0].src}
            images={block.images}
            priority={index === firstGalleryIndex}
          />
        ) : (
          <CopyBlock key={`copy-${index}`} title={block.title} body={block.body} />
        )
      )}

      <div className="next-project container">
        <Link
          className="next-project__link slide-link"
          to={nextProject.destination.to}
          aria-label={`Next project: ${nextProject.title}`}
        >
          <SlideText>Next project →</SlideText>
        </Link>
      </div>
    </article>
  );
}
