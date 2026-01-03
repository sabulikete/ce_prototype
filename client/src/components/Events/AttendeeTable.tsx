import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getEventAttendees } from '../../services/api';

interface Attendee {
  userId: number;
  name: string;
  email: string;
  ticketCount: number;
  statusSummary: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AttendeeTableProps {
  eventId: number;
}

const AttendeeTable: React.FC<AttendeeTableProps> = ({ eventId }) => {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 whenever debounced search changes (when API call happens)
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Fetch attendees when eventId, page, or search changes
  useEffect(() => {
    loadAttendees();
  }, [eventId, currentPage, debouncedSearch]);

  const loadAttendees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEventAttendees(eventId, {
        page: currentPage,
        limit: 20,
        search: debouncedSearch
      });
      setAttendees(response.attendees);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendees');
      setAttendees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearch('');
    setDebouncedSearch('');
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading && attendees.length === 0) {
    return (
      <div className="attendee-table-container">
        <div className="loading-state">Loading attendees...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attendee-table-container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadAttendees} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="attendee-table-container">
      <div className="table-header">
        <h2>Attendees</h2>
        <div className="search-container">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button 
              onClick={handleClearSearch}
              className="clear-search"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {debouncedSearch && (
        <div className="search-results-info">
          Showing {pagination.total} result(s) for "{debouncedSearch}"
        </div>
      )}

      <div className="table-wrapper">
        <table className="attendee-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Ticket Count</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="loading-cell">
                  Loading...
                </td>
              </tr>
            ) : attendees.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-state">
                  {debouncedSearch 
                    ? `No attendees found matching "${debouncedSearch}"` 
                    : 'No tickets issued yet'}
                </td>
              </tr>
            ) : (
              attendees.map((attendee) => (
                <tr key={attendee.userId}>
                  <td>{attendee.name}</td>
                  <td>{attendee.email}</td>
                  <td>{attendee.ticketCount}</td>
                  <td>{attendee.statusSummary}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 0 && (
        <div className="pagination-controls">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            <ChevronLeft size={18} />
            Previous
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={handleNextPage}
            disabled={currentPage >= pagination.totalPages}
            className="pagination-btn"
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendeeTable;
