import authReducer, { updateSignupField, clearSignupForm, setLoading, setError, signupSuccess, loginSuccess, signupFailure, logout } from './authSlice';

describe('authSlice', () => {
  const initialState = {
    signupForm: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
    },
    isLoading: false,
    error: null,
    isAuthenticated: false,
    user: null,
  };

  it('should handle updateSignupField', () => {
    const state = authReducer(initialState, updateSignupField({ field: 'email', value: 'test@example.com' }));
    expect(state.signupForm.email).toBe('test@example.com');
  });

  it('should handle setLoading', () => {
    const state = authReducer(initialState, setLoading(true));
    expect(state.isLoading).toBe(true);
  });

  it('should handle setError', () => {
    const state = authReducer(initialState, setError('Error!'));
    expect(state.error).toBe('Error!');
  });

  it('should handle signupSuccess', () => {
    const user = { id: '1', name: 'Test', email: 'test@example.com' };
    const state = authReducer(initialState, signupSuccess(user));
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
  });

  it('should handle logout', () => {
    const loggedInState = { ...initialState, isAuthenticated: true, user: { id: '1', name: 'Test', email: 'test@example.com' } };
    const state = authReducer(loggedInState, logout());
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
}); 