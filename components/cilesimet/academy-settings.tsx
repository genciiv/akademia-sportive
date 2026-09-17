"use client";

import {
  Building2,
  Save,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type AcademySettingsData = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  logo: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
};

function academyToForm(
  academy: AcademySettingsData
): FormState {
  return {
    name: academy.name,
    email: academy.email ?? "",
    phone: academy.phone ?? "",
    address: academy.address ?? "",
    city: academy.city ?? "",
    country: academy.country ?? "",
  };
}

export function AcademySettings() {
  const router = useRouter();

  const [academy, setAcademy] =
    useState<AcademySettingsData | null>(
      null
    );

  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);

  const [canManage, setCanManage] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAcademy() {
      try {
        const response = await fetch(
          "/api/settings/academy",
          {
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Cilësimet nuk mund të ngarkoheshin."
          );
        }

        if (cancelled) {
          return;
        }

        setAcademy(data.academy);
        setForm(
          academyToForm(data.academy)
        );
        setCanManage(
          data.canManage === true
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Ndodhi një gabim."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAcademy();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function ruaj(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!canManage) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/settings/academy",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Cilësimet nuk mund të ruheshin."
        );
      }

      setAcademy(data.academy);
      setForm(
        academyToForm(data.academy)
      );

      setSuccess(
        "Cilësimet e akademisë u ruajtën me sukses."
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900">
            Informacioni i akademisë
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Menaxho të dhënat bazë dhe
            informacionin e kontaktit.
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Building2 size={17} />
        </div>
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-slate-500">
          Duke ngarkuar...
        </p>
      ) : null}

      {!loading && academy ? (
        <form
          onSubmit={ruaj}
          className="mt-5 grid gap-4 sm:grid-cols-2"
        >
          <label className="block text-xs font-semibold text-slate-500 sm:col-span-2">
            Emri i akademisë
            <input
              value={form.name}
              onChange={(event) =>
                updateField(
                  "name",
                  event.target.value
                )
              }
              disabled={
                !canManage || saving
              }
              maxLength={160}
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-500">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                updateField(
                  "email",
                  event.target.value
                )
              }
              disabled={
                !canManage || saving
              }
              maxLength={320}
              placeholder="info@akademia.al"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-500">
            Telefon
            <input
              value={form.phone}
              onChange={(event) =>
                updateField(
                  "phone",
                  event.target.value
                )
              }
              disabled={
                !canManage || saving
              }
              maxLength={50}
              placeholder="+355 ..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-500 sm:col-span-2">
            Adresa
            <input
              value={form.address}
              onChange={(event) =>
                updateField(
                  "address",
                  event.target.value
                )
              }
              disabled={
                !canManage || saving
              }
              maxLength={240}
              placeholder="Rruga, numri..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-500">
            Qyteti
            <input
              value={form.city}
              onChange={(event) =>
                updateField(
                  "city",
                  event.target.value
                )
              }
              disabled={
                !canManage || saving
              }
              maxLength={120}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-500">
            Shteti
            <input
              value={form.country}
              onChange={(event) =>
                updateField(
                  "country",
                  event.target.value
                )
              }
              disabled={
                !canManage || saving
              }
              maxLength={120}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </label>

          <div className="sm:col-span-2 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Identifikuesi
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {academy.slug}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Statusi
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {academy.status}
              </p>
            </div>
          </div>

          {canManage ? (
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Save size={15} />

                {saving
                  ? "Duke ruajtur..."
                  : "Ruaj ndryshimet"}
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500 sm:col-span-2">
              Ke vetëm akses për lexim.
            </p>
          )}
        </form>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}
    </section>
  );
}