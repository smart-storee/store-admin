"use client";

import { ReactNode } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface ListPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function ListPageHeader({
  title,
  subtitle,
  actions,
}: ListPageHeaderProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`${
        isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
      } border-b sticky top-0 z-40 backdrop-blur-xl transition-all duration-300`}
    >
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1
              className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className={`${
                  isDark ? "text-slate-400" : "text-gray-600"
                } text-sm mt-1`}
              >
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
