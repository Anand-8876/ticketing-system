"use client";

import { useState, useTransition } from "react";
import { setUserRole } from "@/app/actions";
import type { Role } from "@/lib/types";

export function RoleSelect({ userId, role }: { userId: number; role: Role }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <select
        className="input w-auto py-1"
        defaultValue={role}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as Role;
          const el = e.target;
          setError(null);
          startTransition(async () => {
            try {
              await setUserRole(userId, next);
            } catch {
              el.value = role;
              setError("There must be at least one admin.");
            }
          });
        }}
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}
