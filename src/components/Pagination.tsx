import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 mt-12 pb-12">
      <div className="flex w-0 flex-1 border-t-2 border-transparent pr-4">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`inline-flex items-center pr-1 pt-4 text-sm font-medium ${
            currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          Previous
        </button>
      </div>
      <div className="hidden md:flex">
        {Array.from({ length: totalPages }).map((_, i) => {
          const page = i + 1;
          const isCurrent = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium ${
                isCurrent
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>
      <div className="flex w-0 flex-1 justify-end border-t-2 border-transparent pl-4">
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`inline-flex items-center pl-1 pt-4 text-sm font-medium ${
            currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          Next
        </button>
      </div>
    </nav>
  );
};
