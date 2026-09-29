"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tracks", label: "Tracks" },
  { href: "/practice", label: "Practice" },
  { href: "/system-design", label: "System Design" },
  { href: "/debug-lab", label: "Debug Lab" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href={user ? "/dashboard" : "/"} className="text-lg font-bold text-blue-600">
            InterviewPrep
          </Link>
          {user &&
            links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-gray-700 hover:text-blue-600">
                {l.label}
              </Link>
            ))}
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <Link href="/profile" aria-label="Profile" className="text-xl">
              👤
            </Link>
            <button onClick={() => logout()} className="text-sm text-gray-700 hover:text-red-600">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
