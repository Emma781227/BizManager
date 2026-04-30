"use client";

import { FormEvent, useEffect, useState } from "react";

type Customer = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadCustomers(query);
  }, [query]);

  async function loadCustomers(currentQuery: string) {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (currentQuery.trim()) {
      params.set("q", currentQuery.trim());
    }

    try {
      const response = await fetch(`/api/customers?${params.toString()}`, {
        cache: "no-store",
      });
      const json = (await response.json()) as ApiResponse<Customer[]>;

      if (!response.ok || !json.data) {
        setCustomers([]);
        setError(json.error ?? "Impossible de charger les clients.");
        return;
      }

      setCustomers(json.data);
    } catch {
      setCustomers([]);
      setError("Erreur reseau pendant le chargement des clients.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      fullName,
      phone,
      email: email || undefined,
      address: address || undefined,
      notes: notes || undefined,
    };

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as ApiResponse<Customer>;

      if (!response.ok || !json.data) {
        setError(json.error ?? "Impossible de creer le client.");
        return;
      }

      setSuccess("Client cree avec succes.");
      setFullName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setNotes("");
      await loadCustomers(query);
    } catch {
      setError("Erreur reseau pendant la creation du client.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(searchValue);
  }

  return (
    <main className="grid gap-2.5 p-3 sm:gap-3.5 sm:p-4 lg:gap-4 lg:p-5">
      <section className="rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_8%_16%,rgba(34,136,102,0.09)_0%,transparent_46%),linear-gradient(145deg,#ffffff_0%,#f8fbf9_100%)] p-4 sm:p-5">
        <h1 className="mb-2 text-2xl font-bold leading-tight text-slate-900 sm:text-2.5xl">Clients</h1>
        <p className="mb-4 max-w-2xl text-sm text-slate-600 sm:text-base">Centralise ta base clients pour accelerer les commandes.</p>

        <div className="mt-3 grid gap-2 grid-cols-2 sm:gap-2.5 lg:grid-cols-4">
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">Clients trouves</span>
            <strong className="text-base font-bold text-slate-900 sm:text-lg">{customers.length}</strong>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">Recherche active</span>
            <strong className="text-base font-bold text-slate-900 sm:text-lg">{query.trim() ? "Oui" : "Non"}</strong>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">Creation</span>
            <strong className="text-base font-bold text-slate-900 sm:text-lg">{submitting ? "En cours" : "Disponible"}</strong>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">Etat</span>
            <strong className="text-base font-bold text-slate-900 sm:text-lg">{loading ? "Chargement" : "Pret"}</strong>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 sm:p-5">
        <h2 className="mb-3 text-xl font-bold text-slate-900 sm:text-2xl">Nouveau client</h2>
        <form className="mt-3 grid gap-2 grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] lg:gap-3" onSubmit={handleCreateCustomer}>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Nom complet</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              minLength={2}
              required
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Telephone</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              minLength={8}
              required
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Optionnel"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Adresse</span>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Optionnel"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>
          <label className="col-span-full grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Notes</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optionnel"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>
          <button type="submit" disabled={submitting} className="col-span-full rounded-lg border border-emerald-600 bg-gradient-to-b from-emerald-600 to-emerald-700 px-3 py-2 font-bold text-white transition-colors hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-65 sm:col-span-1 sm:px-4 sm:py-2.5">
            {submitting ? "Creation..." : "Creer le client"}
          </button>
        </form>
        {success ? <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 sm:py-2.5 sm:text-base">{success}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Base clients</h2>
          <form className="flex flex-wrap gap-2 sm:gap-2.5" onSubmit={handleSearchSubmit}>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Rechercher nom, telephone, email"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
            <button type="submit" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 font-semibold text-slate-900 transition-colors hover:bg-slate-200 sm:px-4 sm:py-2.5">
              Rechercher
            </button>
          </form>
        </div>

        {loading ? <p className="py-4 text-center text-sm text-slate-600">Chargement...</p> : null}
        {!loading && customers.length === 0 ? <p className="py-4 text-center text-sm text-slate-600">Aucun client trouve.</p> : null}

        {customers.length > 0 ? (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 sm:py-2.5 sm:px-4 sm:text-sm">Nom</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 sm:py-2.5 sm:px-4 sm:text-sm">Telephone</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 sm:py-2.5 sm:px-4 sm:text-sm">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 sm:py-2.5 sm:px-4 sm:text-sm">Adresse</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 text-xs text-slate-900 sm:py-2.5 sm:px-4 sm:text-sm">{customer.fullName}</td>
                    <td className="px-3 py-2 text-xs text-slate-900 sm:py-2.5 sm:px-4 sm:text-sm">{customer.phone}</td>
                    <td className="px-3 py-2 text-xs text-slate-900 sm:py-2.5 sm:px-4 sm:text-sm">{customer.email ?? "-"}</td>
                    <td className="px-3 py-2 text-xs text-slate-900 sm:py-2.5 sm:px-4 sm:text-sm">{customer.address ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:py-2.5 sm:text-base">{error}</p> : null}
      </section>
    </main>
  );
}
