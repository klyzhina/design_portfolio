const MAX_CONTENT_WIDTH = 1340;
const DESKTOP_GUTTERS = 100;
const COLUMN_GAP = 20;

function getImageSizes(images, imageIndex) {
  const totalWeight = images.reduce(
    (total, { weight = 1 }) => total + weight,
    0
  );
  const share = (images[imageIndex].weight ?? 1) / totalWeight;
  const totalGap = Math.max(0, images.length - 1) * COLUMN_GAP;
  const maxWidth = Math.ceil((MAX_CONTENT_WIDTH - totalGap) * share);
  const fluidViewportShare = Number((share * 100).toFixed(4));
  const fluidOffset = Number(
    ((DESKTOP_GUTTERS + totalGap) * share).toFixed(2)
  );

  return `(max-width: 768px) calc(100vw - 40px), (min-width: 1440px) ${maxWidth}px, calc(${fluidViewportShare}vw - ${fluidOffset}px)`;
}

export default function ProjectGallery({ images, priority = false }) {
  const columns = images
    .map(({ weight = 1 }) => `${weight}fr`)
    .join(" ");

  return (
    <div
      className="project-gallery container"
      style={{ "--gallery-columns": columns }}
    >
      {images.map(({ src, srcSet, alt, width, height }, imageIndex) => (
        <figure className="project-gallery__item" key={src}>
          <img
            className="project-gallery__image"
            src={src}
            srcSet={srcSet}
            sizes={getImageSizes(images, imageIndex)}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority && imageIndex === 0 ? "high" : "auto"}
          />
        </figure>
      ))}
    </div>
  );
}
