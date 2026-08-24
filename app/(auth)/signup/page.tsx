"use client";

import { auth } from "@/lib/firebase/client";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function signupErrorMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";

  if (code === "auth/email-already-in-use") {
    return "This email is already registered.";
  }
  if (code === "auth/weak-password") {
    return "Password must be at least 6 characters.";
  }
  if (code === "auth/invalid-email") {
    return "Enter a valid email address.";
  }

  return "Something went wrong. Please try again.";
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const token = await credential.user.getIdToken();

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to finish setting up your account.");
      }

      router.push("/dashboard");
    } catch (err) {
      const hasCode = err && typeof err === "object" && "code" in err;
      setError(
        hasCode
          ? signupErrorMessage(err)
          : err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Sign up</h1>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Signing up…" : "Sign up"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
