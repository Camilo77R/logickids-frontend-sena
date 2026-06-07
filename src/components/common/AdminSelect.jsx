import { Check, ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export default function AdminSelect({
  className = "",
  disabled = false,
  emptyText = "Sin opciones disponibles",
  onChange,
  optionPageSize = 5,
  options = [],
  placeholder = "Selecciona una opcion",
  searchable = true,
  searchMinOptions = 8,
  value = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const selectedOption = options.find((option) => String(option.value) === String(value));
  const shouldShowSearch = searchable && options.length >= searchMinOptions;

  const visibleOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) => {
      const label = option.label?.toLowerCase() || "";
      const description = option.description?.toLowerCase() || "";
      return label.includes(normalizedQuery) || description.includes(normalizedQuery);
    });
  }, [options, query]);

  const totalPages = Math.max(1, Math.ceil(visibleOptions.length / optionPageSize));
  const shouldShowPagination = visibleOptions.length > optionPageSize;
  const pageStart = (page - 1) * optionPageSize;
  const pageEnd = Math.min(pageStart + optionPageSize, visibleOptions.length);
  const paginatedOptions = visibleOptions.slice(pageStart, pageEnd);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    setPage(1);
  }, [isOpen, options, query]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
    setPage(1);
    setQuery("");
  };

  return (
    <div className={`lk-admin-select${className ? ` ${className}` : ""}${isOpen ? " is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="lk-admin-select__trigger"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="lk-admin-select__value">
          <span className={!selectedOption ? "lk-admin-select__placeholder" : undefined}>
            {selectedOption?.label || placeholder}
          </span>
          {selectedOption?.description ? (
            <small>{selectedOption.description}</small>
          ) : null}
        </span>
        <ChevronDown size={16} className="lk-admin-select__chevron" />
      </button>

      {isOpen ? (
        <div className="lk-admin-select__menu" role="listbox">
          {shouldShowSearch ? (
            <div className="lk-admin-select__search">
              <Search size={15} />
              <input
                autoFocus
                type="search"
                placeholder="Buscar..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          ) : null}

          <div className="lk-admin-select__options">
            {visibleOptions.length > 0 ? (
              paginatedOptions.map((option) => {
                const isSelected = String(option.value) === String(value);
                const isDisabled = Boolean(option.disabled);
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    className={`lk-admin-select__option${isSelected ? " is-selected" : ""}${isDisabled ? " is-disabled" : ""}`}
                    disabled={isDisabled}
                    onClick={() => handleSelect(option.value)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled}
                  >
                    <span>
                      <strong>{option.label}</strong>
                      {option.description ? <small>{option.description}</small> : null}
                    </span>
                    {isSelected ? <Check size={16} /> : null}
                  </button>
                );
              })
            ) : (
              <p className="lk-admin-select__empty">{emptyText}</p>
            )}
          </div>

          {shouldShowPagination ? (
            <div className="lk-admin-select__pagination">
              <span>
                {pageStart + 1}-{pageEnd} de {visibleOptions.length}
              </span>
              <div className="lk-admin-select__pagination-actions">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  aria-label="Pagina anterior"
                >
                  <ChevronLeft size={15} />
                </button>
                <strong>{page}</strong>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page === totalPages}
                  aria-label="Pagina siguiente"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
