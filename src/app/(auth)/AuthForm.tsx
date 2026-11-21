"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type FormState } from "@/app/actions";
import { SubmitButton } from "@/components/Buttons";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [state, action] = useActionState<FormState, FormData>(
    mode === "login" ? login : register,
    undefined,
  );
  const isLogin = mode === "login";

  return (
    <form action={action} className="card space-y-4 p-6">
      <div>
        <h1 className="heading neon-text text-xl font-bold">{isLogin ? "Log in" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-mute">
          {isLogin ? "Welcome back to TicketFlow." : "The first account becomes the admin."}
        </p>
      </div>

      {!isLogin && (
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input className="input" id="name" name="name" required autoComplete="name" />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          required
          minLength={isLogin ? undefined : 8}
          autoComplete={isLogin ? "current-password" : "new-password"}
        />
      </div>

      {state?.error && (
        <p className="rounded-md bg-rose-500/10 border border-rose-500/40 px-3 py-2 text-sm text-rose-400">{state.error}</p>
      )}

      <SubmitButton className="btn-primary w-full" pendingText="Please wait…">
        {isLogin ? "Log in" : "Sign up"}
      </SubmitButton>

      <p className="text-center text-sm text-mute">
        {isLogin ? "No account? " : "Already have one? "}
        <Link className="font-medium text-neon hover:underline" href={isLogin ? "/register" : "/login"}>
          {isLogin ? "Sign up" : "Log in"}
        </Link>
      </p>
    </form>
  );
}
