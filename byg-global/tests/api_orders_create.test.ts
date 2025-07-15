import { describe, it, expect, beforeEach, vi } from 'vitest';

// ✅ Use inline mocks, no top-level variables
vi.mock('firebase/firestore', () => {
  // these will be recreated fresh when the mock runs
  const mockAddDoc = vi.fn();
  const mockCollection = vi.fn(() => 'collectionRef');
  const mockGetFirestore = vi.fn();

  // Expose them globally so tests can access
  (globalThis as any).__mockAddDoc = mockAddDoc;
  (globalThis as any).__mockCollection = mockCollection;
  (globalThis as any).__mockGetFirestore = mockGetFirestore;

  return {
    getFirestore: mockGetFirestore,
    collection: mockCollection,
    addDoc: mockAddDoc,
  };
});

// ✅ Mock firebase utils
vi.mock('../src/utils/firebase', () => ({
  app: {},
}));

// ✅ Import AFTER mocks
import { POST } from '../src/app/api/orders/create/route';
import allowedSellers from '../src/config/allowedSellers';

// ✅ Helper to get mocks
function getFirestoreMocks() {
  return {
    mockAddDoc: (globalThis as any).__mockAddDoc,
    mockCollection: (globalThis as any).__mockCollection,
    mockGetFirestore: (globalThis as any).__mockGetFirestore,
  };
}

describe('Order Creation API', () => {
  beforeEach(() => {
    const { mockAddDoc, mockCollection, mockGetFirestore } = getFirestoreMocks();
    mockAddDoc.mockReset();
    mockCollection.mockReset();
    mockGetFirestore.mockReset();
  });

  it('should reject order with missing required fields', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Missing required fields');
  });

  it('should reject order with disallowed sellers', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'user1',
        items: [
          {
            itemId: 'item1',
            title: 'Item 1',
            price: { value: '10', currency: 'USD' },
            quantity: 1,
            sellerInfo: { username: 'notallowed', feedbackPercentage: '90' },
          },
        ],
        paymentMethod: 'paypal',
        paymentDetails: { amount: 10, currency: 'USD' },
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe('One or more sellers are not allowed to create orders.');
  });

  it('should accept order with allowed sellers and create order', async () => {
    const { mockAddDoc } = getFirestoreMocks();
    mockAddDoc.mockResolvedValue({ id: 'order123' });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'user1',
        items: [
          {
            itemId: 'item1',
            title: 'Item 1',
            price: { value: '10', currency: 'USD' },
            quantity: 1,
            sellerInfo: { username: allowedSellers[0], feedbackPercentage: '95' },
          },
        ],
        paymentMethod: 'paypal',
        paymentDetails: { amount: 10, currency: 'USD' },
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.orderId).toBe('order123');
    expect(mockAddDoc).toHaveBeenCalled();
  });
});
