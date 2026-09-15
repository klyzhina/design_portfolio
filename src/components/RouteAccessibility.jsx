import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { caseStudyProjects } from "../data/portfolio";

const OWNER_NAME = "Kseniia Lyzhina";
const HOME_TITLE = `${OWNER_NAME} — Graphic Designer`;

const routeNames = new Map(
  caseStudyProjects.map((project) => [
    project.destination.to,
    project.caseStudy.pageTitle,
  ])
);

export default function RouteAccessibility() {
  const { pathname } = useLocation();
  const announcementRef = useRef(null);
  const normalizedPathname =
    pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
  const routeName = routeNames.get(normalizedPathname) ?? OWNER_NAME;
  const title =
    normalizedPathname === "/"
      ? HOME_TITLE
      : `${routeName} — ${OWNER_NAME}`;

  useLayoutEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    const announcement = announcementRef.current;

    if (!announcement) {
      return undefined;
    }

    announcement.textContent = "";
    const announcementTimer = window.setTimeout(() => {
      announcement.textContent = `${routeName} page loaded.`;
    }, 100);

    return () => window.clearTimeout(announcementTimer);
  }, [routeName]);

  return (
    <div
      ref={announcementRef}
      className="visually-hidden"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    />
  );
}
