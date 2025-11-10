import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../ConfirmDialog';

describe('ConfirmDialog Component', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    isOpen: true,
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?'
  };

  beforeEach(() => {
    mockOnConfirm.mockClear();
    mockOnCancel.mockClear();
  });

  it('renders dialog when isOpen is true', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('renders danger variant with red styling', () => {
    render(<ConfirmDialog {...defaultProps} variant="danger" />);
    
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass('bg-red-600');
  });

  it('renders warning variant with yellow styling', () => {
    render(<ConfirmDialog {...defaultProps} variant="warning" />);
    
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass('bg-yellow-600');
  });

  it('uses custom button text when provided', () => {
    render(
      <ConfirmDialog 
        {...defaultProps} 
        confirmText="Delete"
        cancelText="Go Back"
      />
    );
    
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('displays loading state on confirm button', () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />);
    
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />);
    
    const confirmButton = screen.getByText('Confirm');
    const cancelButton = screen.getByText('Cancel');
    
    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('closes on Escape key', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('does not close when clicking inside dialog', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('renders with icon when provided', () => {
    const Icon = () => <span data-testid="warning-icon">⚠️</span>;
    render(<ConfirmDialog {...defaultProps} icon={<Icon />} />);
    
    expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
  });
});
