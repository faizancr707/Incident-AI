"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FlowConnectorProps {
  length?: number | string;
  vertical?: boolean;
  withArrow?: boolean;
  className?: string;
}

export function FlowConnector({
  length = 32,
  vertical = true,
  withArrow = true,
  className,
}: FlowConnectorProps) {
  if (vertical) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center shrink-0 relative my-0.5",
          className
        )}
      >
        <div
          className="w-[1.5px] bg-[#E2E8F0]"
          style={{ height: typeof length === "number" ? `${length}px` : length }}
        />
        {withArrow && (
          <svg
            className="w-3 h-3 text-[#CBD5E1] -mt-1.5 shrink-0"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 relative mx-0.5",
        className
      )}
    >
      <div
        className="h-[1.5px] bg-[#E2E8F0]"
        style={{ width: typeof length === "number" ? `${length}px` : length }}
      />
      {withArrow && (
        <svg
          className="w-3 h-3 text-[#CBD5E1] -ml-1.5 shrink-0"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.5 2.5L8 6L4.5 9.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

/**
 * BranchConnector renders a 1-to-N tree split with horizontal branch bar
 * and down-arrows into each child column.
 */
interface BranchConnectorProps {
  childrenCount?: 2 | 3;
  className?: string;
}

export function BranchConnector({
  childrenCount = 2,
  className,
}: BranchConnectorProps) {
  return (
    <div className={cn("w-full flex flex-col items-center", className)}>
      {/* Top vertical lead from parent */}
      <div className="w-[1.5px] h-6 bg-[#E2E8F0]" />

      {/* Horizontal crossbar spanning the branches */}
      <div
        className={cn(
          "h-[1.5px] bg-[#E2E8F0] relative",
          childrenCount === 2 ? "w-[62%] sm:w-[55%] md:w-[48%]" : "w-[85%]"
        )}
      >
        {/* Left vertical branch drop */}
        <div className="absolute left-0 top-0 flex flex-col items-center">
          <div className="w-[1.5px] h-6 bg-[#E2E8F0]" />
          <svg
            className="w-3 h-3 text-[#CBD5E1] -mt-1.5"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Center branch drop if 3 children */}
        {childrenCount === 3 && (
          <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center">
            <div className="w-[1.5px] h-6 bg-[#E2E8F0]" />
            <svg
              className="w-3 h-3 text-[#CBD5E1] -mt-1.5"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M2.5 4.5L6 8L9.5 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {/* Right vertical branch drop */}
        <div className="absolute right-0 top-0 flex flex-col items-center">
          <div className="w-[1.5px] h-6 bg-[#E2E8F0]" />
          <svg
            className="w-3 h-3 text-[#CBD5E1] -mt-1.5"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Spacer to align with child cards */}
      <div className="h-6" />
    </div>
  );
}
