// src/components/forms/CreateGuildForm.tsx
"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

const schema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters.").max(32),
  tag: z
    .string()
    .trim()
    .min(2, "Tag must be at least 2 characters.")
    .max(6, "Tag must be at most 6 characters.")
    .regex(/^[A-Za-z0-9]+$/, "Tag must contain only letters and numbers.")
    .transform((v) => v.toUpperCase()),
});

export type CreateGuildValues = z.infer<typeof schema>;

type Props = {
  disabled?: boolean;
  onCreated?: (guild: { id: string; name: string; tag: string }) => void;
};

export function CreateGuildForm({ disabled = false, onCreated }: Props) {
  const form = useForm<CreateGuildValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", tag: "" },
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [notice, setNotice] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(values: CreateGuildValues) {
    setNotice(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/public/account/guild/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.message ||
          (res.status === 401
            ? "You must be signed in."
            : res.status === 409
              ? "Guild name or tag already exists."
              : "Failed to create guild.");
        setNotice({ type: "err", text: msg });
        return;
      }

      setNotice({ type: "ok", text: `Guild created: ${data.guild.name} [${data.guild.tag}]` });
      form.reset({ name: "", tag: "" });
      onCreated?.(data.guild);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/35 p-4">
      <div className="mb-3">
        <div className="text-sm font-semibold text-zinc-100">Create a guild</div>
        <div className="text-xs text-zinc-200/70">Name + Tag only.</div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-200/90">Guild name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. Prancing Pika"
                    disabled={disabled || submitting}
                    className="bg-[#1F2B3A]/60 border-white/10 text-zinc-100 placeholder:text-zinc-200/40"
                  />
                </FormControl>
                <FormDescription className="text-zinc-200/60">
                  3–32 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tag"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-200/90">Guild tag</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="PIKA"
                    disabled={disabled || submitting}
                    className="bg-[#1F2B3A]/60 border-white/10 text-zinc-100 placeholder:text-zinc-200/40 uppercase"
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormDescription className="text-zinc-200/60">
                  2–6 chars, letters/numbers only (auto-uppercase).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {notice && (
            <p
              className={
                notice.type === "ok"
                  ? "text-xs text-emerald-300"
                  : "text-xs text-red-300"
              }
            >
              {notice.text}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              disabled={disabled || submitting}
              className="bg-emerald-500 text-white hover:bg-emerald-400"
            >
              {submitting ? "Creating…" : "Create"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={disabled || submitting}
              className="border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10"
              onClick={() => {
                setNotice(null);
                form.reset();
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
