"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Dumbbell } from "lucide-react";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

type FormState = {
  academyName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  sport: string;
  message: string;
};

const planOptions = {
  STARTER: {
    name: "Starter",
    price: "12,000 ALL / muaj",
    description: "Për akademi të vogla dhe proceset bazë.",
  },
  PRO: {
    name: "Pro",
    price: "20,000 ALL / muaj",
    description: "Menaxhim sportiv dhe administrativ i avancuar.",
  },
  PRO_PORTAL: {
    name: "Pro + Athlete Portal",
    price: "25,000 ALL / muaj",
    description: "Pro me portal të dedikuar për sportistët.",
  },
} as const;

type PlanCode = keyof typeof planOptions;

const initialForm: FormState = {
  academyName: "",
  contactName: "",
  email: "",
  phone: "",
  city: "",
  address: "",
  sport: "",
  message: "",
};

export default function ApplyPage() {
  const searchParams = useSearchParams();

  const requestedPlan = searchParams.get("plan");

  const selectedPlan =
    requestedPlan &&
    Object.prototype.hasOwnProperty.call(planOptions, requestedPlan)
      ? planOptions[requestedPlan as PlanCode]
      : null;
  const selectedPlanCode =
    requestedPlan &&
    Object.prototype.hasOwnProperty.call(planOptions, requestedPlan)
      ? (requestedPlan as PlanCode)
      : null;

  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSending(true);

    try {
      const response = await fetch("/api/academy-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          requestedPlanCode: selectedPlanCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.error || "Aplikimi nuk mund të dërgohej. Provo përsëri.",
        );
        return;
      }

      setSent(true);
      setForm(initialForm);
    } catch {
      setError(
        "Aplikimi nuk mund të dërgohej. Kontrollo lidhjen dhe provo përsëri.",
      );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-[#f7fbff] px-5 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-xl items-center">
          <div className="w-full rounded-[28px] border border-blue-100 bg-white p-8 text-center shadow-[0_24px_70px_rgba(30,64,175,0.10)] sm:p-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={26} />
            </span>

            <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
              Aplikimi u dërgua
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              Faleminderit për interesin. Do ta shqyrtojmë aplikimin dhe do të
              të kontaktojmë në adresën elektronike ose numrin e telefonit që na
              dërgove.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Kthehu në faqen kryesore
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7fbff]">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
              <Dumbbell size={18} />
            </span>

            <div>
              <p className="text-sm font-bold text-slate-950">
                Akademia Sportive
              </p>
              <p className="text-[10px] text-slate-400">
                Platforma e menaxhimit
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
          >
            <ArrowLeft size={15} />
            Kthehu
          </Link>
        </div>
      </header>

      <section className="px-5 py-12 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="max-w-md pt-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              Apliko
            </p>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Interesohesh për platformën?
            </h1>

            <p className="mt-5 text-base leading-7 text-slate-600">
              Na dërgo disa të dhëna për akademinë. Do ta shqyrtojmë aplikimin
              dhe do të kontaktojmë personalisht për hapat e ardhshëm.
            </p>

            <div className="mt-7 space-y-3 text-sm text-slate-600">
              {[
                "Aplikimi nuk krijon automatikisht akademinë.",
                "Do të kontaktohesh pas shqyrtimit.",
                "Aktivizimi bëhet vetëm pas aprovimit.",
              ].map((item) => (
                <div key={item} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-600">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={submit}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            {selectedPlan ? (
              <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">
                  Paketa e zgjedhur
                </p>

                <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-950">
                      {selectedPlan.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedPlan.description}
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-blue-700 sm:mt-0">
                    {selectedPlan.price}
                  </p>
                </div>

                <Link
                  href="/#planet"
                  className="mt-3 inline-flex text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Ndrysho paketën
                </Link>
              </div>
            ) : null}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Emri i akademisë"
                required
                value={form.academyName}
                onChange={(value) => update("academyName", value)}
                placeholder="Akademia..."
              />

              <Field
                label="Personi i kontaktit"
                required
                value={form.contactName}
                onChange={(value) => update("contactName", value)}
                placeholder="Emri dhe mbiemri"
              />

              <Field
                label="Adresa elektronike"
                type="email"
                required
                value={form.email}
                onChange={(value) => update("email", value)}
                placeholder="kontakt@akademia.al"
              />

              <Field
                label="Telefoni"
                type="tel"
                required
                value={form.phone}
                onChange={(value) => update("phone", value)}
                placeholder="+355..."
              />

              <Field
                label="Qyteti"
                value={form.city}
                onChange={(value) => update("city", value)}
                placeholder="Tiranë"
              />

              <Field
                label="Sporti"
                value={form.sport}
                onChange={(value) => update("sport", value)}
                placeholder="Futboll, basketboll..."
              />

              <div className="sm:col-span-2">
                <Field
                  label="Adresa"
                  value={form.address}
                  onChange={(value) => update("address", value)}
                  placeholder="Adresa e akademisë"
                />
              </div>

              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-slate-600">
                  Mesazh
                </span>

                <textarea
                  value={form.message}
                  onChange={(event) => update("message", event.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="Na trego shkurt për akademinë dhe çfarë kërkon nga platforma."
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </label>
            </div>

            {error ? (
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={sending}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Duke dërguar..." : "Dërgo aplikimin"}
              {!sending ? <ArrowRight size={15} /> : null}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-slate-400">
              Duke dërguar aplikimin, pranon që të kontaktohesh lidhur me
              shërbimin Akademia Sportive.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">
        {label}
        {required ? " *" : ""}
      </span>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}
