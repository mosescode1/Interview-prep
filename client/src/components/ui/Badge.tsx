"use client";
import React from "react";

const variants = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  gray: "bg-gray-100 text-gray-800",
};

export default function Badge({
  children,
  variant = "gray",
  className = "",
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
