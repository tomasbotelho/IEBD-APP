export const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {Array.from({ length: totalPages }).map((_, index) => {
        const nextPage = index + 1;

        return (
          <button
            key={nextPage}
            className={`h-11 min-w-11 rounded-full px-4 text-sm font-semibold ${
              nextPage === page ? "bg-pine-500 text-white" : "bg-white text-ink-900"
            }`}
            onClick={() => onPageChange(nextPage)}
            type="button"
          >
            {nextPage}
          </button>
        );
      })}
    </nav>
  );
};
