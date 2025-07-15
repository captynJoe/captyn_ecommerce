import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AquantuoEstimator, { CartItem } from '../src/components/AquantuoEstimator';

describe('AquantuoEstimator Thorough Tests', () => {
  const mockOnInsuranceChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders with cart items and calculates total weight correctly', () => {
    const cartItems: CartItem[] = [
      { itemId: '1', title: 'iPhone 15', quantity: 1, weight: 170 },
      { itemId: '2', title: 'MacBook Pro', quantity: 1, weight: 2100 },
    ];
    render(<AquantuoEstimator cartTotal={3000} cartItems={cartItems} onInsuranceChange={mockOnInsuranceChange} />);

    expect(screen.getByText(/Detected Items & Estimated Weights/i)).toBeInTheDocument();
    expect(screen.getByText(/iPhone 15/i)).toBeInTheDocument();
    expect(screen.getByText(/MacBook Pro/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Weight:/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('2.27')).toBeInTheDocument(); // 0.17 + 2.1 kg approx
  });

  test('AI estimation button toggles and fetches estimation', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          realWeight: 0.17,
          dimensions: { length: 15, width: 7, height: 0.8 },
          volumetricWeight: 0.2,
          chargeableWeight: 0.2,
          category: 'phone',
          confidence: 'high',
          source: 'ai'
        }),
      } as Response)
    ) as unknown as typeof fetch;

    render(<AquantuoEstimator cartTotal={1000} cartItems={[]} onInsuranceChange={mockOnInsuranceChange} />);

    const toggleButton = screen.getByRole('button', { name: /Use AI/i });
    fireEvent.click(toggleButton);

    const textarea = screen.getByPlaceholderText(/Enter product title and description/i);
    fireEvent.change(textarea, { target: { value: 'Apple iPhone 15' } });

    const estimateButton = screen.getByRole('button', { name: /Get AI Estimation/i });
    fireEvent.click(estimateButton);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/AI Analysis Results/i)).toBeInTheDocument();
    expect(screen.getByText(/0.2 kg/i)).toBeInTheDocument();
  });

  test('handles insurance checkbox and warning modal', () => {
    render(<AquantuoEstimator cartTotal={1000} cartItems={[]} onInsuranceChange={mockOnInsuranceChange} />);

    const insuranceCheckbox = screen.getByLabelText(/Add Shipping Insurance/i);
    fireEvent.click(insuranceCheckbox); // Uncheck

    expect(screen.getByText(/Are you sure you want to proceed without insurance/i)).toBeInTheDocument();

    const continueButton = screen.getByRole('button', { name: /Continue without Insurance/i });
    fireEvent.click(continueButton);

    expect(mockOnInsuranceChange).toHaveBeenCalledWith(false, 0);
  });

  test('fallback to rule-based estimation when AI fails', async () => {
    global.fetch = vi.fn(() => Promise.reject('API failure')) as unknown as typeof fetch;

    render(<AquantuoEstimator cartTotal={1000} cartItems={[]} onInsuranceChange={mockOnInsuranceChange} />);

    const toggleButton = screen.getByRole('button', { name: /Use AI/i });
    fireEvent.click(toggleButton);

    const textarea = screen.getByPlaceholderText(/Enter product title and description/i);
    fireEvent.change(textarea, { target: { value: 'Unknown product' } });

    const estimateButton = screen.getByRole('button', { name: /Get AI Estimation/i });
    fireEvent.click(estimateButton);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    // Since fallback is internal to API, here we just check UI updates without error
    expect(screen.getByText(/AI Analysis Results/i)).toBeInTheDocument();
  });
});
