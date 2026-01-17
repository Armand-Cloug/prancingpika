// src/components/forms/JoinGuildForm.tsx
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
  inviteCode: z
    .string()
    .trim()
    .min(2, "Enter a tag or an invite code.")
    .max(64, "Too long.")
    .regex(/^[A-Za-z0-9 _-]+$/, "Invalid characters."),
});

export type JoinGuildValues = z.infer<typeof schema>;

type Props = {
  disabled?: boolean;
  onJoined?: (guild: { id: string; name: string; tag: string }) => void;
};

export function JoinGuildForm({ disabled = false, onJoined }: Props) {
  const form = useForm<JoinGuildValues>({
    resolver: zodResolver(schema),
    defaultValues: { inviteCode: "" },
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [notice, setNotice] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(values: JoinGuildValues) {
    setNotice(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/public/account/guild/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagOrCode: values.inviteCode }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.message ||
          (res.status === 401
            ? "You must be signed in."
            : res.status === 404
              ? "Guild not found."
              : res.status === 409
                ? "You are already a member of this guild."
                : "Failed to join guild.");
        setNotice({ type: "err", text: msg });
        return;
      }

      setNotice({ type: "ok", text: `Joined: ${data.guild.name} [${data.guild.tag}]` });
      form.reset({ inviteCode: "" });
      onJoined?.(data.guild);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/35 p-4">
      <div className="mb-3">
        <div className="text-sm font-semibold text-zinc-100">Join a guild</div>
        <div className="text-xs text-zinc-200/70">Use a tag or invite code.</div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="inviteCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-200/90">Tag / Invite code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. PIKA"
                    disabled={disabled || submitting}
                    className="bg-[#1F2B3A]/60 border-white/10 text-zinc-100 placeholder:text-zinc-200/40"
                  />
                </FormControl>
                <FormDescription className="text-zinc-200/60">
                  For now : joining by TAG works. (Invite codes later.)
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

          <Button
            type="submit"
            disabled={disabled || submitting}
            className="bg-white/10 text-zinc-100 hover:bg-white/15 border border-white/10"
          >
            {submitting ? "Joining…" : "Join"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
