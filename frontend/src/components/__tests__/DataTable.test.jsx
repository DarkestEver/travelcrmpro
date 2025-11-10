import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DataTable from '../DataTable';

describe('DataTable Component', () => {
  const mockColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'status', label: 'Status', sortable: false }
  ];

  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'active' }
  ];

  const mockPagination = {
    page: 1,
    pages: 3,
    total: 30,
    limit: 10
  };

  const defaultProps = {
    columns: mockColumns,
    data: mockData,
    pagination: mockPagination,
    onPageChange: vi.fn(),
    onSearch: vi.fn(),
    loading: false
  };

  it('renders table with data', () => {
    render(<DataTable {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<DataTable {...defaultProps} />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('displays loading spinner when loading', () => {
    render(<DataTable {...defaultProps} loading={true} />);
    
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toBeInTheDocument();
  });

  it('calls onSearch when search input changes', async () => {
    render(<DataTable {...defaultProps} showSearch={true} />);
    
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    await waitFor(() => {
      expect(defaultProps.onSearch).toHaveBeenCalledWith('john');
    });
  });

  it('displays pagination controls', () => {
    render(<DataTable {...defaultProps} />);
    
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('calls onPageChange when pagination button clicked', () => {
    render(<DataTable {...defaultProps} />);
    
    const nextButton = screen.getByLabelText('Next page');
    fireEvent.click(nextButton);
    
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables previous button on first page', () => {
    render(<DataTable {...defaultProps} />);
    
    const prevButton = screen.getByLabelText('Previous page');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    const lastPagePagination = { ...mockPagination, page: 3 };
    render(<DataTable {...defaultProps} pagination={lastPagePagination} />);
    
    const nextButton = screen.getByLabelText('Next page');
    expect(nextButton).toBeDisabled();
  });

  it('renders empty state when no data', () => {
    render(<DataTable {...defaultProps} data={[]} />);
    
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('shows filter menu when filter button clicked', () => {
    const filterOptions = [
      { value: 'active', label: 'Active', checked: false },
      { value: 'inactive', label: 'Inactive', checked: false }
    ];

    render(
      <DataTable 
        {...defaultProps} 
        showFilter={true} 
        filterOptions={filterOptions}
        onFilter={vi.fn()}
      />
    );
    
    const filterButton = screen.getByText('Filter');
    fireEvent.click(filterButton);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders custom cell renderers', () => {
    const columnsWithRenderer = [
      { 
        key: 'name', 
        label: 'Name',
        render: (value) => <span className="font-bold">{value}</span>
      }
    ];

    render(<DataTable {...defaultProps} columns={columnsWithRenderer} />);
    
    const nameCell = screen.getByText('John Doe');
    expect(nameCell).toHaveClass('font-bold');
  });

  it('displays correct number of rows per page', () => {
    render(<DataTable {...defaultProps} />);
    
    const rows = screen.getAllByRole('row');
    // +1 for header row
    expect(rows).toHaveLength(mockData.length + 1);
  });
});
