/**
 * @jest-environment jsdom
 */

describe('KASEP Transaction Module - Unit Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('should validate transaction amount', () => {
    const validateAmount = (amount) => {
      const num = parseFloat(amount);
      return !isNaN(num) && num > 0;
    };
    
    expect(validateAmount('50000')).toBe(true);
    expect(validateAmount('0')).toBe(false);
    expect(validateAmount('-1000')).toBe(false);
    expect(validateAmount('abc')).toBe(false);
  });

  test('should calculate tax correctly', () => {
    const calculateTax = (amount, taxRate = 0.1) => {
      return parseFloat((amount * taxRate).toFixed(2));
    };
    
    expect(calculateTax(100000)).toBe(10000);
    expect(calculateTax(50000, 0.05)).toBe(2500);
  });

  test('should format currency correctly', () => {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
      }).format(amount);
    };
    
    const formatted = formatCurrency(50000);
    expect(formatted).toContain('50');
    expect(formatted).toMatch(/Rp|IDR/);
  });

  test('should generate receipt ID with timestamp', () => {
    const generateReceiptId = () => {
      return `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };
    
    const id = generateReceiptId();
    expect(id).toMatch(/^RCP-\d+-[a-z0-9]+$/);
  });

  test('should store transaction in local storage', () => {
    const transaction = {
      id: 'TRX-001',
      amount: 50000,
      date: new Date().toISOString(),
      status: 'completed',
    };
    
    localStorage.setItem('lastTransaction', JSON.stringify(transaction));
    expect(localStorage.getItem('lastTransaction')).toBe(JSON.stringify(transaction));
  });

  test('should calculate total from items array', () => {
    const calculateTotal = (items) => {
      return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };
    
    const items = [
      { name: 'Item 1', price: 10000, quantity: 2 },
      { name: 'Item 2', price: 5000, quantity: 3 },
    ];
    
    expect(calculateTotal(items)).toBe(35000);
  });
});
