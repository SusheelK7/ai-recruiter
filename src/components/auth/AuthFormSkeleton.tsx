"use client";

import React from "react";

interface AuthFormSkeletonProps {
  type?: "login" | "register";
}

export function AuthFormSkeleton({ type = "login" }: AuthFormSkeletonProps) {
  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center animate-fade-slide">
      {/* Form Header Skeleton */}
      <div className="mb-6 space-y-2">
        <div className="h-7 w-48 rounded-lg skeleton-shimmer" />
        <div className="h-3.5 w-64 rounded-md skeleton-shimmer" />
      </div>

      {/* Inputs Skeleton */}
      <div className="flex flex-col gap-4">
        {type === "register" && (
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-24 rounded-md skeleton-shimmer" />
            <div className="h-10 w-full rounded-lg skeleton-shimmer" />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-28 rounded-md skeleton-shimmer" />
          <div className="h-10 w-full rounded-lg skeleton-shimmer" />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-20 rounded-md skeleton-shimmer" />
          <div className="h-10 w-full rounded-lg skeleton-shimmer" />
          {type === "login" && (
            <div className="flex justify-end mt-1">
              <div className="h-3 w-28 rounded-md skeleton-shimmer" />
            </div>
          )}
        </div>

        {type === "register" && (
          <>
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-32 rounded-md skeleton-shimmer" />
              <div className="h-10 w-full rounded-lg skeleton-shimmer" />
            </div>

            <div className="flex items-center gap-2 mt-1">
              <div className="h-4 w-4 rounded skeleton-shimmer" />
              <div className="h-3.5 w-48 rounded-md skeleton-shimmer" />
            </div>
          </>
        )}

        {/* Submit Button Skeleton */}
        <div className="h-11 w-full rounded-lg skeleton-shimmer mt-2" />
      </div>

      {/* Footer Switch Skeleton */}
      <div className="mt-6 flex justify-center">
        <div className="h-3.5 w-44 rounded-md skeleton-shimmer" />
      </div>
    </div>
  );
}
