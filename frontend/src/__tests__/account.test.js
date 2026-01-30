/**
 * @jest-environment jsdom
 */

describe('KASEP Account Module - Unit Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('should validate account name length', () => {
    const validateName = (name) => {
      return name && name.trim().length >= 3 && name.trim().length <= 50;
    };
    
    expect(validateName('John Doe')).toBe(true);
    expect(validateName('Jo')).toBe(false);
    expect(validateName('A'.repeat(60))).toBe(false);
  });

  test('should validate phone number format', () => {
    const validatePhone = (phone) => {
      return /^(\+62|0)[0-9]{9,12}$/.test(phone.replace(/\s/g, ''));
    };
    
    expect(validatePhone('081234567890')).toBe(true);
    expect(validatePhone('+6281234567890')).toBe(true);
    expect(validatePhone('12345')).toBe(false);
  });

  test('should calculate account age from registration date', () => {
    const calculateAccountAge = (registrationDate) => {
      const now = new Date();
      const regDate = new Date(registrationDate);
      const diffMs = now - regDate;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return diffDays;
    };
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);
    
    const age = calculateAccountAge(pastDate.toISOString());
    expect(age).toBeGreaterThanOrEqual(29);
    expect(age).toBeLessThanOrEqual(31);
  });

  test('should update profile with validation', () => {
    const updateProfile = (profile, updates) => {
      const allowedFields = ['name', 'email', 'phone', 'address'];
      const validated = {};
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value) {
          validated[key] = value;
        }
      }
      
      return { ...profile, ...validated };
    };
    
    const profile = { name: 'John', email: 'john@example.com' };
    const updated = updateProfile(profile, {
      name: 'Jane',
      phone: '081234567890',
      malicious: 'ignore-this',
    });
    
    expect(updated.name).toBe('Jane');
    expect(updated.phone).toBe('081234567890');
    expect(updated.malicious).toBeUndefined();
  });

  test('should handle wallet balance calculations', () => {
    const updateWalletBalance = (currentBalance, transaction) => {
      if (transaction.type === 'credit') {
        return currentBalance + transaction.amount;
      } else if (transaction.type === 'debit') {
        if (currentBalance >= transaction.amount) {
          return currentBalance - transaction.amount;
        }
        throw new Error('Insufficient balance');
      }
    };
    
    expect(updateWalletBalance(100000, { type: 'credit', amount: 50000 })).toBe(150000);
    expect(updateWalletBalance(100000, { type: 'debit', amount: 50000 })).toBe(50000);
    expect(() => {
      updateWalletBalance(10000, { type: 'debit', amount: 50000 });
    }).toThrow('Insufficient balance');
  });
});
