import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage,
  itemLabel = "registro",
  itemPluralLabel,
  onPageChange,
  pageSize = 10,
  totalItems,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems <= pageSize) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const label = totalItems === 1 ? itemLabel : itemPluralLabel || `${itemLabel}s`;

  return (
    <nav className="lk-admin-pagination" aria-label="Paginación">
      <span className="lk-admin-pagination__summary">
        {startItem}-{endItem} de {totalItems} {label}
      </span>
      <div className="lk-admin-pagination__controls">
        <button
          type="button"
          className="lk-admin-pagination__button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={`lk-admin-pagination__page ${currentPage === page ? "is-active" : ""}`}
            onClick={() => onPageChange(page)}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          className="lk-admin-pagination__button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
