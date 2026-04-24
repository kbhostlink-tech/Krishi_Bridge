"use client";

import { useState } from "react";
import { toast } from "sonner";

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      topic: String(data.get("topic") || "general"),
      message: String(data.get("message") || "").trim(),
    };

    if (!payload.name || !payload.email || !payload.message) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }

    setSubmitting(true);
    try {
      // Placeholder: real endpoint can be wired later without changing SEO surface.
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success("Thanks! We'll get back to you within one business day.");
      form.reset();
    } catch {
      toast.error("Something went wrong. Please email support@krishibridge.com.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-sage-700">Full name</span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            className="mt-1 w-full rounded-lg border border-sage-200 bg-white px-3 py-2 text-sm outline-none focus:border-sage-500"
          />
        </label>
        <label className="block text-sm">
          <span className="text-sage-700">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-sage-200 bg-white px-3 py-2 text-sm outline-none focus:border-sage-500"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="text-sage-700">Topic</span>
        <select
          name="topic"
          defaultValue="general"
          className="mt-1 w-full rounded-lg border border-sage-200 bg-white px-3 py-2 text-sm outline-none focus:border-sage-500"
        >
          <option value="general">General enquiry</option>
          <option value="farmer">Farmer / cooperative onboarding</option>
          <option value="buyer">Buyer / import enquiry</option>
          <option value="warehouse">Warehouse partnership</option>
          <option value="press">Press &amp; media</option>
          <option value="support">Account support</option>
        </select>
      </label>

      <label className="block text-sm">
        <span className="text-sage-700">Message</span>
        <textarea
          name="message"
          rows={5}
          required
          className="mt-1 w-full rounded-lg border border-sage-200 bg-white px-3 py-2 text-sm outline-none focus:border-sage-500"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-full bg-sage-900 px-5 py-3 text-sm font-medium text-white hover:bg-sage-800 disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
