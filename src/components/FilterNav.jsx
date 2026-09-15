export default function FilterNav({ filters, activeFilter, onFilterChange }) {
  return (
    <div className="filter-nav" role="group" aria-label="Filter projects">
      {filters.map((filter) => (
        <button
          className="body-copy filter-nav__button"
          key={filter}
          type="button"
          aria-pressed={activeFilter === filter}
          onClick={() => onFilterChange(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
