'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginRequest, validateEmail } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Left Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-xl">
          {/* Logo and Store Name */}
          <div className="flex items-center gap-3 mb-16">
            <div
              className="flex items-center justify-center"
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#4169E1',
                borderRadius: '12px',
                color: 'var(--text-white)',
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-bold)'
              }}
            >
              S
            </div>
            <div>
              <h1
                className="text-xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Store Admin
              </h1>
              <p
                className="text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                Admin Portal
              </p>
            </div>
          </div>

          {/* Login Form Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-white)',
              borderRadius: 'var(--radius-xl)',
              padding: '48px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}
          >
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Login to Dashboard
            </h2>
            <p
              className="text-sm mb-8"
              style={{ color: 'var(--text-secondary)' }}
            >
              Fill the below form to login
            </p>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Email or Mobile <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError && validateEmail(e.target.value)) {
                      setEmailError('');
                    }
                  }}
                  className="appearance-none block w-full transition-all"
                  style={{
                    padding: '14px 16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    backgroundColor: '#F9FAFB',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = '#FFFFFF';
                    e.target.style.borderColor = '#4169E1';
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = '#F9FAFB';
                    e.target.style.borderColor = '#E5E7EB';
                  }}
                  placeholder="Enter your Email or mobile no"
                />
                {emailError && (
                  <p className="mt-2 text-sm" style={{ color: 'var(--error-color)' }}>
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Password <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError && e.target.value.length >= 6) {
                      setPasswordError('');
                    }
                  }}
                  className="appearance-none block w-full transition-all"
                  style={{
                    padding: '14px 16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    backgroundColor: '#F9FAFB',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = '#FFFFFF';
                    e.target.style.borderColor = '#4169E1';
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = '#F9FAFB';
                    e.target.style.borderColor = '#E5E7EB';
                  }}
                  placeholder="Enter your password"
                />
                {passwordError && (
                  <p className="mt-2 text-sm" style={{ color: 'var(--error-color)' }}>
                    {passwordError}
                  </p>
                )}
              </div>

              {error && (
                <div
                  className="text-sm text-center p-3 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--error-color)'
                  }}
                >
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center font-semibold transition-all"
                  style={{
                    padding: '14px 24px',
                    backgroundColor: isLoading ? '#9CA3AF' : '#4169E1',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '16px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#3457C0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#4169E1';
                    }
                  }}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Column - Image Slider */}
      <div
        className="hidden lg:flex lg:w-1/2 items-center justify-center"
        style={{
          backgroundColor: '#4169E1',
          padding: '48px'
        }}
      >
        {/* Placeholder for Image Slider */}
        <div
          className="flex items-center justify-center"
          style={{
            width: '100%',
            height: '500px',
            border: '3px dashed rgba(255, 255, 255, 0.4)',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}
        >
          <p
            className="text-lg font-medium"
            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            Image Placeholder
          </p>
        </div>
      </div>
    </div>
  );
}