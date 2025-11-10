import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal Component', () => {
  const mockOnClose = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    title: 'Test Modal',
    children: <div>Modal Content</div>
  };

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders modal when isOpen is true', () => {
    render(<Modal {...defaultProps} />);
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('does not render modal when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    render(<Modal {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking backdrop', () => {
    render(<Modal {...defaultProps} />);
    
    const backdrop = screen.getByRole('dialog').parentElement;
    fireEvent.click(backdrop);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not close when clicking modal content', () => {
    render(<Modal {...defaultProps} />);
    
    const modalContent = screen.getByText('Modal Content');
    fireEvent.click(modalContent);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />);
    let dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('max-w-md');

    rerender(<Modal {...defaultProps} size="lg" />);
    dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('max-w-4xl');

    rerender(<Modal {...defaultProps} size="xl" />);
    dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('max-w-6xl');
  });

  it('renders footer when provided', () => {
    const footer = (
      <div>
        <button>Cancel</button>
        <button>Save</button>
      </div>
    );

    render(<Modal {...defaultProps} footer={footer} />);
    
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('prevents body scroll when modal is open', () => {
    render(<Modal {...defaultProps} />);
    
    expect(document.body).toHaveStyle({ overflow: 'hidden' });
  });

  it('restores body scroll when modal closes', () => {
    const { unmount } = render(<Modal {...defaultProps} />);
    
    unmount();
    
    expect(document.body).not.toHaveStyle({ overflow: 'hidden' });
  });

  it('closes on Escape key press', () => {
    render(<Modal {...defaultProps} />);
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('traps focus within modal', async () => {
    render(
      <Modal {...defaultProps}>
        <input data-testid="input1" />
        <button data-testid="button1">Button</button>
        <input data-testid="input2" />
      </Modal>
    );

    const input1 = screen.getByTestId('input1');
    const button1 = screen.getByTestId('button1');
    
    input1.focus();
    expect(document.activeElement).toBe(input1);

    fireEvent.keyDown(document.activeElement, { key: 'Tab' });
    await waitFor(() => {
      expect(document.activeElement).toBe(button1);
    });
  });

  it('renders with custom className', () => {
    render(<Modal {...defaultProps} className="custom-modal" />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('custom-modal');
  });

  it('displays loading state in footer', () => {
    const footer = (
      <button disabled>
        <span>Loading...</span>
      </button>
    );

    render(<Modal {...defaultProps} footer={footer} />);
    
    const button = screen.getByText('Loading...');
    expect(button.closest('button')).toBeDisabled();
  });
});
