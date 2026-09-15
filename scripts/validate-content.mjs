import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  categoryFilters,
  portfolioById,
  portfolioItems,
} from "../src/data/portfolio.js";
import { imageDescriptions } from "../src/data/imageDescriptions.js";
import { imageDimensions } from "../src/data/imageDimensions.js";
import { imageVariants } from "../src/data/imageVariants.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const errors = [];
const projectIds = new Set();
const internalRoutes = new Set();
const internalRoutePattern = /^\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const allowedCategories = new Set(categoryFilters.slice(1));
const referencedSources = new Set();
const referencedDescriptions = new Set();
const manifestAssets = new Set();

const walkFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });

const report = (projectId, message) => {
  errors.push(`${projectId}: ${message}`);
};

const validateImage = (projectId, media, context) => {
  if (!media?.source?.startsWith("/images/")) {
    report(projectId, `${context} must declare an absolute /images/ source`);
    return;
  }

  const { source } = media;
  referencedSources.add(source);

  if (!media.alt?.trim()) {
    report(projectId, `${context} needs meaningful alternative text`);
  }

  if (!Number.isInteger(media.width) || !Number.isInteger(media.height)) {
    report(projectId, `${context} needs intrinsic width and height metadata`);
  }

  if (!imageDimensions[source]) {
    report(projectId, `${context} has no dimension metadata for ${source}`);
  }

  const sourcePath = path.join(projectRoot, "source-media", source.slice(1));
  if (!existsSync(sourcePath)) {
    report(projectId, `${context} references missing source artwork ${source}`);
  }

  const optimized = imageVariants[source];
  if (!optimized) {
    report(projectId, `${context} has no optimized variants for ${source}`);
    return;
  }

  if (media.src !== optimized.src || media.srcSet !== optimized.srcSet) {
    report(projectId, `${context} does not match the generated image manifest`);
  }

  if (!Array.isArray(optimized.variants) || optimized.variants.length === 0) {
    report(projectId, `${context} has an empty optimized variant list`);
    return;
  }

  let previousWidth = 0;
  for (const variant of optimized.variants) {
    manifestAssets.add(variant.src);

    if (!Number.isInteger(variant.width) || variant.width <= previousWidth) {
      report(
        projectId,
        `${context} optimized widths must be positive and strictly ascending`
      );
      break;
    }
    previousWidth = variant.width;

    if (
      !variant.src?.startsWith("/images/") ||
      !/\.w\d+\.[a-f0-9]{12}\.webp$/.test(variant.src)
    ) {
      report(
        projectId,
        `${context} has an unsafe or non-fingerprinted variant ${variant.src}`
      );
      continue;
    }

    const assetPath = path.join(
      projectRoot,
      "public",
      variant.src.slice(1)
    );
    if (!existsSync(assetPath)) {
      report(projectId, `${context} references missing asset ${variant.src}`);
    }
  }

  const largestVariant = optimized.variants.at(-1);
  if (optimized.src !== largestVariant.src) {
    report(projectId, `${context} fallback must use its largest variant`);
  }
};

for (const project of portfolioItems) {
  if (projectIds.has(project.id)) {
    report(project.id, "project id is duplicated");
  }
  projectIds.add(project.id);

  validateImage(project.id, project.cover, "cover");

  const categories = Array.isArray(project.categories) ? project.categories : [];
  if (categories.length === 0) {
    report(project.id, "categories must be a non-empty array");
  }

  for (const category of categories) {
    if (!allowedCategories.has(category)) {
      report(project.id, `unknown category ${category}`);
    }
  }

  const { destination = {} } = project;
  if (destination.kind === "internal") {
    if (!internalRoutePattern.test(destination.to ?? "")) {
      report(
        project.id,
        "internal destination must be a safe, root-relative route"
      );
    }
    if ("href" in destination) {
      report(project.id, "internal destination cannot also define href");
    }
    if (internalRoutes.has(destination.to)) {
      report(project.id, `internal route ${destination.to} is duplicated`);
    }
    if (!project.caseStudy) {
      report(project.id, "internal destination needs case-study content");
    }
    internalRoutes.add(destination.to);
  } else if (destination.kind === "external") {
    if ("to" in destination) {
      report(project.id, "external destination cannot also define to");
    }
    if (project.caseStudy) {
      report(project.id, "external destination cannot define a case study");
    }

    try {
      const url = new URL(destination.href);
      if (!["http:", "https:"].includes(url.protocol)) {
        report(project.id, "external destination must use HTTP or HTTPS");
      }
    } catch {
      report(project.id, "external destination is not a valid URL");
    }
  } else {
    report(project.id, `unknown destination kind ${destination.kind}`);
  }

  if (
    project.caseStudy &&
    (!project.caseStudy.pageTitle?.trim() ||
      !project.caseStudy.intro?.title?.trim() ||
      !project.caseStudy.intro?.body?.trim())
  ) {
    report(project.id, "case study needs a page title and titled introduction");
  }

  for (const [index, block] of (project.caseStudy?.blocks ?? []).entries()) {
    if (block.kind === "gallery") {
      if (block.images.length === 0) {
        report(project.id, `gallery ${index + 1} is empty`);
      }
      block.images.forEach((media, mediaIndex) => {
        const authoredDescription = imageDescriptions[media.source];

        if (!authoredDescription) {
          report(
            project.id,
            `gallery ${index + 1}, image ${mediaIndex + 1} has no authored description`
          );
        } else {
          referencedDescriptions.add(media.source);

          if (media.alt !== authoredDescription) {
            report(
              project.id,
              `gallery ${index + 1}, image ${mediaIndex + 1} does not use its authored description`
            );
          }
        }

        validateImage(
          project.id,
          media,
          `gallery ${index + 1}, image ${mediaIndex + 1}`
        );
      });
    } else if (block.kind === "copy") {
      if (!block.body?.trim()) {
        report(project.id, `copy block ${index + 1} has no body`);
      }
    } else {
      report(project.id, `block ${index + 1} has unknown kind ${block.kind}`);
    }
  }
}

for (const project of portfolioItems.filter(({ caseStudy }) => caseStudy)) {
  const nextProject = portfolioById[project.caseStudy.nextProjectId];
  if (!nextProject || nextProject.destination.kind !== "internal") {
    report(project.id, "nextProjectId must reference an internal project");
  } else if (nextProject.id === project.id) {
    report(project.id, "nextProjectId cannot reference the same project");
  }
}

for (const source of Object.keys(imageDimensions)) {
  if (!referencedSources.has(source)) {
    report("media", `unused dimension metadata for ${source}`);
  }
}

for (const source of Object.keys(imageVariants)) {
  if (!imageDimensions[source]) {
    report("media", `optimized manifest has no dimensions for ${source}`);
  }
  if (!referencedSources.has(source)) {
    report("media", `optimized manifest includes unused source ${source}`);
  }
}

for (const source of Object.keys(imageDescriptions)) {
  if (!referencedDescriptions.has(source)) {
    report("media", `unused authored image description for ${source}`);
  }
}

const publicImagesRoot = path.join(projectRoot, "public", "images");
if (!existsSync(publicImagesRoot)) {
  report("media", "generated public/images directory is missing");
} else {
  for (const filePath of walkFiles(publicImagesRoot)) {
    const relativePath = path
      .relative(publicImagesRoot, filePath)
      .split(path.sep)
      .join("/");
    const publicPath = `/images/${relativePath}`;

    if (!manifestAssets.has(publicPath)) {
      report("media", `public/images includes stale output ${publicPath}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Content validation failed:\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${portfolioItems.length} projects and ${internalRoutes.size} case-study routes.`
  );
}
