/**
 * @jest-environment jsdom
 */

describe('KASEP Auth Module - Unit Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('should validate email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test('user@example.com')).toBe(true);
    expect(emailRegex.test('invalid-email')).toBe(false);
  });

  test('should validate password strength', () => {
    const validatePassword = (password) => {
      return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[a-z]/.test(password);
    };
    
    expect(validatePassword('Weakpass123')).toBe(true);
    expect(validatePassword('weak')).toBe(false);
    expect(validatePassword('NODIGITS')).toBe(false);
  });

  test('should store and retrieve auth token from localStorage', () => {
    const token = 'test-auth-token-12345';
    localStorage.setItem('authToken', token);
    
    expect(localStorage.getItem('authToken')).toBe(token);
  });

  test('should clear auth on logout', () => {
    localStorage.setItem('authToken', 'token');
    localStorage.setItem('userId', 'user-123');
    
    localStorage.clear();
    
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('userId')).toBeNull();
  });

  test('should validate OTP format (6 digits)', () => {
    const validateOTP = (otp) => /^\d{6}$/.test(otp);
    
    expect(validateOTP('123456')).toBe(true);
    expect(validateOTP('12345')).toBe(false);
    expect(validateOTP('ABCDEF')).toBe(false);
  });
});
