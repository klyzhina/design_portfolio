#!/usr/bin/env node

import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  brotliCompressSync,
  constants as zlibConstants,
  gzipSync,
} from "node:zlib";

const KIB = 1024;
const MIB = KIB * KIB;

/*
 * These are regression guardrails, not claims about a universal performance
 * score. The ceilings leave practical headroom over the measured production
 * baseline while still making code, media, or variant-count regressions an
 * explicit decision. The responsive-image pipeline deliberately prunes source
 * artwork and orphaned output instead of copying the old 52 MiB public tree.
 */
const BUDGETS = Object.freeze({
  javascriptGzip: 100 * KIB,
  javascriptBrotli: 90 * KIB,
  cssGzip: 4 * KIB,
  cssBrotli: 3.5 * KIB,
  htmlGzip: 2 * KIB,
  htmlBrotli: 1.5 * KIB,
  appShellGzip: 110 * KIB,
  appShellBrotli: 95 * KIB,
  totalDist: 11 * MIB,
  imageBytes: 10 * MIB,
  imageCount: 220,
});

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const distRoot = path.join(projectRoot, "dist");
const publicRoot = path.join(projectRoot, "public");

const imageExtensions = new Set([
  ".avif",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);
const mediaExtensions = new Set([".m4v", ".mov", ".mp4", ".ogg", ".webm"]);

const codeGroups = [
  {
    key: "javascript",
    label: "JavaScript",
    extensions: new Set([".cjs", ".js", ".mjs"]),
    gzipBudget: BUDGETS.javascriptGzip,
    brotliBudget: BUDGETS.javascriptBrotli,
  },
  {
    key: "css",
    label: "CSS",
    extensions: new Set([".css"]),
    gzipBudget: BUDGETS.cssGzip,
    brotliBudget: BUDGETS.cssBrotli,
  },
  {
    key: "html",
    label: "HTML",
    extensions: new Set([".htm", ".html"]),
    gzipBudget: BUDGETS.htmlGzip,
    brotliBudget: BUDGETS.htmlBrotli,
  },
];

function formatBytes(bytes) {
  if (bytes >= MIB) {
    return `${(bytes / MIB).toFixed(2)} MiB`;
  }

  if (bytes >= KIB) {
    return `${(bytes / KIB).toFixed(2)} KiB`;
  }

  return `${bytes} B`;
}

function formatCount(count) {
  return new Intl.NumberFormat("en-US").format(count);
}

function toRelativePath(absolutePath) {
  return path.relative(distRoot, absolutePath).split(path.sep).join("/");
}

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));

  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return walkFiles(absolutePath);
      }

      return entry.isFile() ? [absolutePath] : [];
    })
  );

  return nestedFiles.flat();
}

function compress(buffer) {
  return {
    gzip: gzipSync(buffer, { level: 9 }).byteLength,
    brotli: brotliCompressSync(buffer, {
      params: {
        [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
      },
    }).byteLength,
  };
}

async function measureCodeGroup(records, group) {
  const matchingRecords = records.filter((record) =>
    group.extensions.has(record.extension)
  );
  const measurements = await Promise.all(
    matchingRecords.map(async (record) => {
      const buffer = await readFile(record.absolutePath);
      return {
        raw: buffer.byteLength,
        ...compress(buffer),
      };
    })
  );

  return {
    ...group,
    count: matchingRecords.length,
    raw: measurements.reduce((total, item) => total + item.raw, 0),
    gzip: measurements.reduce((total, item) => total + item.gzip, 0),
    brotli: measurements.reduce((total, item) => total + item.brotli, 0),
  };
}

function printCodeTable(groups) {
  console.log("\nCompressed application shell");
  console.log(
    "  Type        Files        Raw       Gzip     Brotli"
  );

  for (const group of groups) {
    console.log(
      `  ${group.label.padEnd(10)} ${String(group.count).padStart(5)} ${formatBytes(group.raw).padStart(10)} ${formatBytes(group.gzip).padStart(10)} ${formatBytes(group.brotli).padStart(10)}`
    );
  }
}

function printArtifactTable({
  copiedImages,
  generatedImages,
  images,
  media,
  sourceMaps,
  totalBytes,
  totalFiles,
}) {
  const sumBytes = (records) =>
    records.reduce((total, record) => total + record.size, 0);

  console.log("\nProduction artifact");
  console.log(
    `  Copied public images   ${String(copiedImages.length).padStart(5)} files  ${formatBytes(sumBytes(copiedImages)).padStart(10)}`
  );
  console.log(
    `  Generated images       ${String(generatedImages.length).padStart(5)} files  ${formatBytes(sumBytes(generatedImages)).padStart(10)}`
  );
  console.log(
    `  All images             ${String(images.length).padStart(5)} files  ${formatBytes(sumBytes(images)).padStart(10)}`
  );
  console.log(
    `  Audio/video            ${String(media.length).padStart(5)} files  ${formatBytes(sumBytes(media)).padStart(10)}`
  );
  console.log(
    `  Source maps            ${String(sourceMaps.length).padStart(5)} files  ${formatBytes(sumBytes(sourceMaps)).padStart(10)}`
  );
  console.log(
    `  Entire dist            ${String(totalFiles).padStart(5)} files  ${formatBytes(totalBytes).padStart(10)}`
  );
}

function makeBudgetCheck(label, actual, limit, formatter = formatBytes) {
  return {
    label,
    actual,
    limit,
    formatter,
    passed: actual <= limit,
  };
}

function printBudgetResults(checks, structuralFailures) {
  console.log("\nBudget results");

  for (const check of checks) {
    const status = check.passed ? "PASS" : "FAIL";
    console.log(
      `  ${status}  ${check.label}: ${check.formatter(check.actual)} / ${check.formatter(check.limit)}`
    );
  }

  for (const failure of structuralFailures) {
    console.log(`  FAIL  ${failure}`);
  }

  const failedChecks = checks.filter((check) => !check.passed);
  if (failedChecks.length === 0 && structuralFailures.length === 0) {
    console.log("\nPerformance budgets passed.");
    return true;
  }

  console.error(
    `\nPerformance budgets failed (${failedChecks.length + structuralFailures.length} issue${failedChecks.length + structuralFailures.length === 1 ? "" : "s"}).`
  );
  return false;
}

async function main() {
  let distStats;

  try {
    distStats = await stat(distRoot);
  } catch {
    throw new Error(
      `Missing production output at ${distRoot}. Run the production build first.`
    );
  }

  if (!distStats.isDirectory()) {
    throw new Error(`Expected ${distRoot} to be a directory.`);
  }

  const absoluteFiles = await walkFiles(distRoot);
  if (absoluteFiles.length === 0) {
    throw new Error(`Production output at ${distRoot} is empty.`);
  }

  const records = await Promise.all(
    absoluteFiles.map(async (absolutePath) => {
      const fileStats = await stat(absolutePath);
      const relativePath = toRelativePath(absolutePath);

      return {
        absolutePath,
        relativePath,
        extension: path.extname(relativePath).toLowerCase(),
        size: fileStats.size,
      };
    })
  );

  const measuredGroups = await Promise.all(
    codeGroups.map((group) => measureCodeGroup(records, group))
  );
  const images = records.filter((record) =>
    imageExtensions.has(record.extension)
  );
  const copiedImages = images.filter((record) =>
    existsSync(path.join(publicRoot, record.relativePath))
  );
  const generatedImages = images.filter(
    (record) => !existsSync(path.join(publicRoot, record.relativePath))
  );
  const media = records.filter((record) =>
    mediaExtensions.has(record.extension)
  );
  const sourceMaps = records.filter((record) => record.extension === ".map");
  const totalBytes = records.reduce((total, record) => total + record.size, 0);
  const imageBytes = images.reduce((total, record) => total + record.size, 0);
  const appShellGzip = measuredGroups.reduce(
    (total, group) => total + group.gzip,
    0
  );
  const appShellBrotli = measuredGroups.reduce(
    (total, group) => total + group.brotli,
    0
  );

  console.log("Production performance budget");
  console.log(`  Output: ${distRoot}`);
  printCodeTable(measuredGroups);
  printArtifactTable({
    copiedImages,
    generatedImages,
    images,
    media,
    sourceMaps,
    totalBytes,
    totalFiles: records.length,
  });

  const checks = measuredGroups.flatMap((group) => [
    makeBudgetCheck(`${group.label} gzip`, group.gzip, group.gzipBudget),
    makeBudgetCheck(
      `${group.label} Brotli`,
      group.brotli,
      group.brotliBudget
    ),
  ]);
  checks.push(
    makeBudgetCheck("App shell gzip", appShellGzip, BUDGETS.appShellGzip),
    makeBudgetCheck(
      "App shell Brotli",
      appShellBrotli,
      BUDGETS.appShellBrotli
    ),
    makeBudgetCheck("All image bytes", imageBytes, BUDGETS.imageBytes),
    makeBudgetCheck(
      "Image count",
      images.length,
      BUDGETS.imageCount,
      formatCount
    ),
    makeBudgetCheck("Entire dist", totalBytes, BUDGETS.totalDist)
  );

  const structuralFailures = measuredGroups
    .filter((group) => group.count === 0)
    .map((group) => `No emitted ${group.label} files were found.`);
  const passed = printBudgetResults(checks, structuralFailures);
  if (!passed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Performance budget check could not run: ${error.message}`);
  process.exitCode = 1;
});
