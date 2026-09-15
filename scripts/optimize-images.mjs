#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  linkSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { imageDimensions } from "../src/data/imageDimensions.js";

const PIPELINE_VERSION = 1;
const QUALITY = 82;
const TARGET_WIDTHS = [480, 768, 1340];
const CWEBP = process.env.CWEBP_BIN || "cwebp";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const sourceMediaRoot = path.join(projectRoot, "source-media");
const sourceImagesRoot = path.join(sourceMediaRoot, "images");
const publicImagesRoot = path.join(projectRoot, "public", "images");
const publicIconsPath = path.join(projectRoot, "public", "icons.svg");
const sourceIconsPath = path.join(sourceMediaRoot, "icons.svg");
const manifestPath = path.join(projectRoot, "src", "data", "imageVariants.js");
const stagingRoot = path.join(
  sourceMediaRoot,
  `.optimize-images-staging-${process.pid}`
);
const publicBackupRoot = path.join(
  sourceMediaRoot,
  `.optimize-images-public-backup-${process.pid}`
);
const manifestTempPath = path.join(
  sourceMediaRoot,
  `.imageVariants-${process.pid}.tmp`
);
const manifestBackupPath = path.join(
  sourceMediaRoot,
  `.imageVariants-backup-${process.pid}.js`
);

const fail = (message) => {
  throw new Error(message);
};

const sha256 = (...chunks) => {
  const hash = createHash("sha256");
  for (const chunk of chunks) hash.update(chunk);
  return hash.digest("hex");
};

const listFiles = (root) => {
  if (!existsSync(root)) return [];

  return readdirSync(root, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name, "en"))
    .flatMap((entry) => {
      const entryPath = path.join(root, entry.name);
      if (entry.isDirectory()) return listFiles(entryPath);
      if (!entry.isFile()) {
        fail(`Unsupported non-file media entry: ${entryPath}`);
      }
      return entryPath;
    });
};

const copyTree = (sourceRoot, destinationRoot) => {
  mkdirSync(destinationRoot, { recursive: true });

  for (const entry of readdirSync(sourceRoot, { withFileTypes: true })) {
    const sourcePath = path.join(sourceRoot, entry.name);
    const destinationPath = path.join(destinationRoot, entry.name);

    if (entry.isDirectory()) {
      copyTree(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      mkdirSync(path.dirname(destinationPath), { recursive: true });
      copyFileSync(sourcePath, destinationPath);
    } else {
      fail(`Unsupported non-file media entry: ${sourcePath}`);
    }
  }
};

const archiveOriginalMedia = () => {
  mkdirSync(sourceMediaRoot, { recursive: true });

  if (
    !existsSync(sourceImagesRoot) ||
    listFiles(sourceImagesRoot).length === 0
  ) {
    if (!existsSync(publicImagesRoot)) {
      fail(
        "Cannot bootstrap source-media/images because public/images is missing"
      );
    }

    console.log("Archiving original public/images under source-media/images...");
    copyTree(publicImagesRoot, sourceImagesRoot);
  }

  if (existsSync(publicIconsPath)) {
    if (!existsSync(sourceIconsPath)) {
      copyFileSync(publicIconsPath, sourceIconsPath);
    } else if (
      sha256(readFileSync(publicIconsPath)) !==
      sha256(readFileSync(sourceIconsPath))
    ) {
      fail(
        "public/icons.svg differs from source-media/icons.svg; refusing to discard either copy"
      );
    }
  }
};

const assertLogicalImagePath = (logicalPath) => {
  const prefix = "/images/";
  if (!logicalPath.startsWith(prefix)) {
    fail(`Image manifest key must start with ${prefix}: ${logicalPath}`);
  }

  const relativePath = logicalPath.slice(prefix.length);
  if (
    !relativePath ||
    relativePath.includes("\\") ||
    path.posix.normalize(relativePath) !== relativePath ||
    relativePath.startsWith("../")
  ) {
    fail(`Unsafe logical image path: ${logicalPath}`);
  }

  return relativePath;
};

const encoderVersionResult = spawnSync(CWEBP, ["-version"], {
  encoding: "utf8",
});
if (encoderVersionResult.error) {
  fail(`Unable to run ${CWEBP}: ${encoderVersionResult.error.message}`);
}
if (encoderVersionResult.status !== 0) {
  fail(
    `${CWEBP} -version failed: ${encoderVersionResult.stderr?.trim() || "unknown error"}`
  );
}
const encoderVersion = (
  encoderVersionResult.stdout || encoderVersionResult.stderr
).trim();

archiveOriginalMedia();

const entries = Object.entries(imageDimensions).sort(([left], [right]) =>
  left < right ? -1 : left > right ? 1 : 0
);

for (const [logicalPath, dimensions] of entries) {
  const relativePath = assertLogicalImagePath(logicalPath);
  const sourcePath = path.join(sourceImagesRoot, ...relativePath.split("/"));

  if (!existsSync(sourcePath) || !statSync(sourcePath).isFile()) {
    fail(`Missing archived source for ${logicalPath}: ${sourcePath}`);
  }
  if (!Number.isInteger(dimensions.width) || dimensions.width <= 0) {
    fail(`Invalid source width for ${logicalPath}: ${dimensions.width}`);
  }
}

rmSync(stagingRoot, { recursive: true, force: true });
mkdirSync(stagingRoot, { recursive: true });

const generatedManifest = {};
let generatedCount = 0;
let reusedCount = 0;

try {
  for (const [logicalPath, dimensions] of entries) {
    const relativePath = assertLogicalImagePath(logicalPath);
    const sourcePath = path.join(sourceImagesRoot, ...relativePath.split("/"));
    const sourceBytes = readFileSync(sourcePath);
    const parsedPath = path.posix.parse(relativePath);
    const widths = [...new Set([...TARGET_WIDTHS, dimensions.width])]
      .filter((width) => width <= dimensions.width)
      .sort((left, right) => left - right);
    const variants = [];

    for (const width of widths) {
      const encoderConfig = JSON.stringify({
        pipelineVersion: PIPELINE_VERSION,
        encoder: "cwebp",
        encoderVersion,
        quality: QUALITY,
        metadata: "none",
        width,
      });
      const fingerprint = sha256(
        sourceBytes,
        "\0",
        encoderConfig
      ).slice(0, 12);
      const outputName = `${parsedPath.name}.w${width}.${fingerprint}.webp`;
      const outputRelativePath = path.posix.join(parsedPath.dir, outputName);
      const outputPath = path.join(
        stagingRoot,
        ...outputRelativePath.split("/")
      );
      const currentOutputPath = path.join(
        publicImagesRoot,
        ...outputRelativePath.split("/")
      );

      mkdirSync(path.dirname(outputPath), { recursive: true });

      if (
        existsSync(currentOutputPath) &&
        statSync(currentOutputPath).isFile() &&
        statSync(currentOutputPath).size > 0
      ) {
        linkSync(currentOutputPath, outputPath);
        reusedCount += 1;
      } else {
        const result = spawnSync(
          CWEBP,
          [
            "-quiet",
            "-q",
            String(QUALITY),
            "-metadata",
            "none",
            "-resize",
            String(width),
            "0",
            sourcePath,
            "-o",
            outputPath,
          ],
          { encoding: "utf8" }
        );

        if (result.error) {
          fail(`Failed to run ${CWEBP} for ${logicalPath}: ${result.error.message}`);
        }
        if (result.status !== 0) {
          fail(
            `${CWEBP} failed for ${logicalPath} at ${width}px: ${result.stderr?.trim() || "unknown error"}`
          );
        }
        if (!existsSync(outputPath) || statSync(outputPath).size === 0) {
          fail(`${CWEBP} produced no output for ${logicalPath} at ${width}px`);
        }
        generatedCount += 1;
      }

      variants.push({
        src: `/images/${outputRelativePath}`,
        width,
      });
    }

    const largestVariant = variants.at(-1);
    generatedManifest[logicalPath] = {
      src: largestVariant.src,
      srcSet: variants
        .map((variant) => `${variant.src} ${variant.width}w`)
        .join(", "),
      variants,
    };
  }

  const manifestSource = `// Generated by scripts/optimize-images.mjs. Do not edit.\nexport const imageVariants = ${JSON.stringify(generatedManifest, null, 2)};\n`;
  writeFileSync(manifestTempPath, manifestSource, "utf8");

  if (existsSync(publicImagesRoot)) {
    renameSync(publicImagesRoot, publicBackupRoot);
  }
  if (existsSync(manifestPath)) {
    renameSync(manifestPath, manifestBackupPath);
  }

  try {
    renameSync(stagingRoot, publicImagesRoot);
    renameSync(manifestTempPath, manifestPath);
  } catch (error) {
    rmSync(publicImagesRoot, { recursive: true, force: true });
    rmSync(manifestPath, { force: true });
    if (existsSync(publicBackupRoot)) {
      renameSync(publicBackupRoot, publicImagesRoot);
    }
    if (existsSync(manifestBackupPath)) {
      renameSync(manifestBackupPath, manifestPath);
    }
    throw error;
  }

  rmSync(publicBackupRoot, { recursive: true, force: true });
  rmSync(manifestBackupPath, { force: true });
  rmSync(publicIconsPath, { force: true });

  const publicBytes = listFiles(publicImagesRoot).reduce(
    (total, filePath) => total + statSync(filePath).size,
    0
  );
  console.log(
    `Optimized ${entries.length} logical images into ${generatedCount + reusedCount} variants ` +
      `(${generatedCount} generated, ${reusedCount} reused).`
  );
  console.log(
    `public/images now contains ${(publicBytes / 1024 / 1024).toFixed(2)} MiB.`
  );
} finally {
  rmSync(stagingRoot, { recursive: true, force: true });
  rmSync(manifestTempPath, { force: true });
}
