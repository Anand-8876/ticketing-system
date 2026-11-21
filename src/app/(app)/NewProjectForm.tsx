"use client";

import { useActionState, useRef, useState } from "react";
import { createProject, type FormState } from "@/app/actions";
import { SubmitButton } from "@/components/Buttons";

function suggestKey(name: string) {
  const words = name.toUpperCase().replace(/[^A-Z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const key = words.length === 1 ? words[0].slice(0, 4) : words.map((w) => w[0]).join("");
  return key.replace(/^[0-9]+/, "").slice(0, 6);
}

export function NewProjectForm() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action] = useActionState<FormState, FormData>(createProject, undefined);
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);

  return (
    <>
      <button className="btn-primary" onClick={() => dialog.current?.showModal()}>
        + Create project
      </button>
      <dialog ref={dialog} className="m-auto w-full max-w-md rounded-xl p-0 shadow-2xl">
        <form action={action} className="space-y-4 p-6">
          <h2 className="heading neon-text text-lg font-bold">Create project</h2>
          <div>
            <label className="label" htmlFor="pname">Name</label>
            <input
              id="pname"
              name="name"
              className="input"
              required
              autoFocus
              onChange={(e) => !keyTouched && setKey(suggestKey(e.target.value))}
            />
          </div>
          <div>
            <label className="label" htmlFor="pkey">Key</label>
            <input
              id="pkey"
              name="key"
              className="input font-mono uppercase"
              required
              maxLength={6}
              value={key}
              onChange={(e) => {
                setKeyTouched(true);
                setKey(e.target.value.toUpperCase());
              }}
            />
            <p className="mt-1 text-xs text-mute">
              Ticket IDs look like {key || "KEY"}-1, {key || "KEY"}-2…
            </p>
          </div>
          <div>
            <label className="label" htmlFor="pdesc">Description</label>
            <textarea id="pdesc" name="description" rows={3} className="input" />
          </div>
          {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => dialog.current?.close()}>
              Cancel
            </button>
            <SubmitButton pendingText="Creating…">Create</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
