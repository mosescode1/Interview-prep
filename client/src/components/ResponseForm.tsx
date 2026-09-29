"use client";
import React, { useState } from "react";
import Button from "./ui/Button";

export default function ResponseForm({
  onSubmit,
  placeholder = "Type your response...",
  loading = false,
  label,
}: {
  onSubmit: (response: string) => void;
  placeholder?: string;
  loading?: boolean;
  label?: string;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value);
      }}
      className="space-y-3"
    >
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={8}
        className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <Button type="submit" loading={loading} disabled={!value.trim()}>
        Submit
      </Button>
    </form>
  );
}
