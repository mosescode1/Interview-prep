"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const inputCls = "w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

export default function Page() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, username, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="mb-6 text-2xl font-bold">Create Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          <input type="text" required placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} />
          <input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">Create Account</Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          <Link href="/login" className="text-blue-600 hover:underline">Already have an account? Log in</Link>
        </p>
      </Card>
    </div>
  );
}
