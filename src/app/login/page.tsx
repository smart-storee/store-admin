"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { validateEmail } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { LOGIN_CONSTANTS } from "@/constants/login";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { login } = useAuth();

  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
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
    setError("");

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex animate-fade-in"
      style={{ backgroundColor: "#F5F5F5" }}
    >
      {/* Left Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-xl animate-slide-in-left">
          {/* Logo and Store Name */}
          <div className="flex items-center gap-3 mb-16">
            <div
              className="flex items-center justify-center animate-scale-in"
              style={{
                width: "48px",
                height: "48px",
                background: "linear-gradient(135deg, #4169E1 0%, #6366F1 100%)",
                borderRadius: "12px",
                color: "var(--text-white)",
                fontSize: "var(--font-size-2xl)",
                fontWeight: "var(--font-weight-bold)",
                boxShadow: "0 4px 6px rgba(65, 105, 225, 0.3)",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1) rotate(5deg)";
                e.currentTarget.style.boxShadow =
                  "0 6px 12px rgba(65, 105, 225, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                e.currentTarget.style.boxShadow =
                  "0 4px 6px rgba(65, 105, 225, 0.3)";
              }}
            >
              {LOGIN_CONSTANTS.STORE_INITIAL}
            </div>
            <div>
              <h1
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {LOGIN_CONSTANTS.STORE_NAME}
              </h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {LOGIN_CONSTANTS.PORTAL_NAME}
              </p>
            </div>
          </div>

          {/* Login Form Card */}
          <div
            className="animate-scale-in"
            style={{
              backgroundColor: "var(--bg-white)",
              borderRadius: "20px",
              padding: "48px",
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              transition: "all 0.3s",
            }}
          >
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Login to Dashboard
            </h2>
            <p
              className="text-sm mb-8"
              style={{ color: "var(--text-secondary)" }}
            >
              Fill the below form to login
            </p>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Email ID <span style={{ color: "#EF4444" }}>*</span>
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
                      setEmailError("");
                    }
                  }}
                  className="appearance-none block w-full transition-all"
                  style={{
                    padding: "14px 16px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    backgroundColor: "#F9FAFB",
                    color: "var(--text-primary)",
                    fontSize: "15px",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = "#FFFFFF";
                    e.target.style.borderColor = "#4169E1";
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = "#F9FAFB";
                    e.target.style.borderColor = "#E5E7EB";
                  }}
                  placeholder="Enter your Email ID"
                />
                {emailError && (
                  <p
                    className="mt-2 text-sm"
                    style={{ color: "var(--error-color)" }}
                  >
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Password <span style={{ color: "#EF4444" }}>*</span>
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
                      setPasswordError("");
                    }
                  }}
                  className="appearance-none block w-full transition-all duration-200"
                  style={{
                    padding: "14px 16px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "10px",
                    backgroundColor: "#F9FAFB",
                    color: "var(--text-primary)",
                    fontSize: "15px",
                    outline: "none",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = "#FFFFFF";
                    e.target.style.borderColor = "#4169E1";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(65, 105, 225, 0.1)";
                    e.target.style.transform = "translateY(-1px)";
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = "#F9FAFB";
                    e.target.style.borderColor = "#E5E7EB";
                    e.target.style.boxShadow = "none";
                    e.target.style.transform = "translateY(0)";
                  }}
                  placeholder="Enter your password"
                />
                {passwordError && (
                  <p
                    className="mt-2 text-sm"
                    style={{ color: "var(--error-color)" }}
                  >
                    {passwordError}
                  </p>
                )}
              </div>

              {error && (
                <div
                  className="text-sm text-center p-3 rounded-lg"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    color: "var(--error-color)",
                  }}
                >
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center font-semibold transition-all duration-200 hover-lift active:scale-95"
                  style={{
                    padding: "14px 24px",
                    backgroundColor: isLoading ? "#9CA3AF" : "#4169E1",
                    color: "#FFFFFF",
                    borderRadius: "10px",
                    border: "none",
                    fontSize: "16px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.7 : 1,
                    boxShadow: isLoading
                      ? "none"
                      : "0 4px 6px rgba(65, 105, 225, 0.2)",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = "#3457C0";
                      e.currentTarget.style.boxShadow =
                        "0 6px 12px rgba(65, 105, 225, 0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = "#4169E1";
                      e.currentTarget.style.boxShadow =
                        "0 4px 6px rgba(65, 105, 225, 0.2)";
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Column - Image Slider */}
      <div
        className="hidden lg:flex lg:w-1/2 items-center justify-center animate-slide-in-right"
        style={{
          background:
            "linear-gradient(135deg, #4169E1 0%, #6366F1 50%, #8B5CF6 100%)",
          padding: "48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: "absolute",
            top: "-50%",
            right: "-50%",
            width: "200%",
            height: "200%",
            background:
              "radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)",
            animation: "pulse 4s ease-in-out infinite",
          }}
        />
        {/* Image Slider */}
        <div
          className="flex items-center justify-center animate-scale-in"
          style={{
            width: "100%",
            height: "500px",
            borderRadius: "20px",
            position: "relative",
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          <Image
            src={LOGIN_CONSTANTS.LOGIN_IMAGE}
            alt="Login"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
      </div>
    </div>
  );
}
