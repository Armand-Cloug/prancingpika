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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MAX_BYTES = 200 * 1024 * 1024;

const schema = z.object({
  guildId: z.string().min(1, "Choose a guild."),
  file: z
    .any()
    .refine((f) => f instanceof File, "Please choose a file.")
    .refine((f: File) => f.size > 0, "File is empty.")
    .refine((f: File) => f.size <= MAX_BYTES, "Max file size is 200 MB.")
    .refine(
      (f: File) => f.name.toLowerCase().endsWith(".txt"),
      "Only .txt files are allowed."
    ),
});

export type UploadLogValues = z.infer<typeof schema>;

type GuildOption = { id: string; name: string; tag: string };

type Props = {
  guilds: GuildOption[];
  disabled?: boolean; // si tu veux forcer
  helper?: string;
  onUploaded?: (payload: any) => void;
};

export function UploadLogForm({ guilds, disabled = false, helper, onUploaded }: Props) {
  const form = useForm<UploadLogValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      guildId: guilds[0]?.id ?? "",
      file: undefined as any,
    },
  });

  React.useEffect(() => {
    // si la liste de guildes arrive après un fetch
    const current = form.getValues("guildId");
    if (!current && guilds[0]?.id) form.setValue("guildId", guilds[0].id);
  }, [guilds, form]);

  const [submitting, setSubmitting] = React.useState(false);
  const [notice, setNotice] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);

  const noGuild = guilds.length === 0;
  const isDisabled = disabled || noGuild || submitting;

  async function onSubmit(values: UploadLogValues) {
    setNotice(null);
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("guildId", values.guildId);
      fd.append("file", values.file);

      const res = await fetch("/api/public/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.message ||
          (res.status === 401
            ? "You must be signed in."
            : res.status === 403
              ? "You must be a member of that guild."
              : "Upload failed.");
        setNotice({ type: "err", text: msg });
        return;
      }

      setNotice({ type: "ok", text: `Uploaded: ${data.file.fileName}` });
      form.reset({ guildId: values.guildId, file: undefined as any });
      onUploaded?.(data);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/35 p-4">
      <div className="mb-3">
        <div className="text-sm font-semibold text-zinc-100">Upload a combat log</div>
        <div className="text-xs text-zinc-200/70">Only .txt — max 200MB.</div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="guildId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-200/90">Upload as</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isDisabled}
                  >
                    <SelectTrigger className="bg-[#1F2B3A]/60 border-white/10 text-zinc-100">
                      <SelectValue placeholder="Choose a guild" />
                    </SelectTrigger>
                    <SelectContent>
                      {guilds.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name} [{g.tag}]
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription className="text-zinc-200/60">
                  {noGuild ? "Join or create a guild to enable uploads." : "Select which guild owns this upload."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="file"
            render={() => (
              <FormItem>
                <FormLabel className="text-zinc-200/90">File (.txt)</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    disabled={isDisabled}
                    accept=".txt"
                    className="bg-[#1F2B3A]/60 border-white/10 text-zinc-100 file:text-zinc-100"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      form.setValue("file", f as any, { shouldValidate: true });
                    }}
                  />
                </FormControl>
                <FormDescription className="text-zinc-200/60">
                  {helper ?? "Upload one .txt combat log."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {notice && (
            <p className={notice.type === "ok" ? "text-xs text-emerald-300" : "text-xs text-red-300"}>
              {notice.text}
            </p>
          )}

          <Button
            type="submit"
            disabled={isDisabled}
            className="bg-sky-500 text-white hover:bg-sky-400 disabled:opacity-60"
          >
            {submitting ? "Uploading…" : "Upload"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
