import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import FilterNav from "../components/FilterNav";
import ProjectCard from "../components/ProjectCard";
import { categoryFilters, homeProjects } from "../data/portfolio";

const LAST_FILTER_STORAGE_KEY = "filter:last";

function readStoredFilter(storageKey) {
  try {
    const storedFilter =
      sessionStorage.getItem(storageKey) ??
      sessionStorage.getItem(LAST_FILTER_STORAGE_KEY);
    return categoryFilters.includes(storedFilter) ? storedFilter : "ALL";
  } catch {
    return "ALL";
  }
}

function storeFilter(storageKey, filter) {
  try {
    sessionStorage.setItem(storageKey, filter);
    sessionStorage.setItem(LAST_FILTER_STORAGE_KEY, filter);
  } catch {
    // The filter still works when browser storage is unavailable.
  }
}

export default function Home() {
  const { key: locationKey } = useLocation();
  const filterStorageKey = `filter:${locationKey}`;
  const [activeFilter, setActiveFilter] = useState(() =>
    readStoredFilter(filterStorageKey)
  );

  useEffect(() => {
    storeFilter(filterStorageKey, activeFilter);
  }, [activeFilter, filterStorageKey]);

  const changeFilter = (filter) => {
    setActiveFilter(filter);
    storeFilter(filterStorageKey, filter);
  };

  const filteredProjects =
    activeFilter === "ALL"
      ? homeProjects
      : homeProjects.filter((project) =>
          project.categories.includes(activeFilter)
        );

  return (
    <>
      <section className="home-hero container" aria-labelledby="home-title">
        <h1
          id="home-title"
          className="display-heading home-hero__title"
          tabIndex={-1}
        >
          Kseniia Lyzhina
        </h1>
        <p className="body-copy home-hero__intro">
          Graphic designer with 5+ years of experience, design teacher, and
          coding enthusiast. I want to build something meaningful — drop me a
          message, if you do too.
        </p>
      </section>

      <section
        id="works"
        className="project-list container"
        aria-label="Works"
        tabIndex={-1}
      >
        <FilterNav
          filters={categoryFilters}
          activeFilter={activeFilter}
          onFilterChange={changeFilter}
        />

        <p
          className="visually-hidden"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {`${filteredProjects.length} ${
            filteredProjects.length === 1 ? "project" : "projects"
          } shown${
            activeFilter === "ALL"
              ? " across all categories"
              : ` for ${activeFilter.toLowerCase()}`
          }.`}
        </p>

        {filteredProjects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            priority={index === 0}
          />
        ))}
      </section>
    </>
  );
}
