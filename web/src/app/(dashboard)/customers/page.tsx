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
    <main className="page-stack merchant-grid">
      <section className="card merchant-hero">
        <h1>Clients</h1>
        <p>Centralise ta base clients pour accelerer les commandes.</p>

        <div className="merchant-kpi">
          <article>
            <span>Clients trouves</span>
            <strong>{customers.length}</strong>
          </article>
          <article>
            <span>Recherche active</span>
            <strong>{query.trim() ? "Oui" : "Non"}</strong>
          </article>
          <article>
            <span>Creation</span>
            <strong>{submitting ? "En cours" : "Disponible"}</strong>
          </article>
          <article>
            <span>Etat</span>
            <strong>{loading ? "Chargement" : "Pret"}</strong>
          </article>
        </div>
      </section>

      <section className="card merchant-surface">
        <h2>Nouveau client</h2>
        <form className="form-grid" onSubmit={handleCreateCustomer}>
          <label>
            Nom complet
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              minLength={2}
              required
            />
          </label>
          <label>
            Telephone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              minLength={8}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Optionnel"
            />
          </label>
          <label>
            Adresse
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Optionnel"
            />
          </label>
          <label className="full-width">
            Notes
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optionnel"
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? "Creation..." : "Creer le client"}
          </button>
        </form>
        {success ? <p className="feedback success">{success}</p> : null}
      </section>

      <section className="card merchant-surface">
        <div className="toolbar">
          <h2>Base clients</h2>
          <form className="inline-form" onSubmit={handleSearchSubmit}>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Rechercher nom, telephone, email"
            />
            <button type="submit">Rechercher</button>
          </form>
        </div>

        {loading ? <p>Chargement...</p> : null}
        {!loading && customers.length === 0 ? <p>Aucun client trouve.</p> : null}

        {customers.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Telephone</th>
                  <th>Email</th>
                  <th>Adresse</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.fullName}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.email ?? "-"}</td>
                    <td>{customer.address ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {error ? <p className="feedback error">{error}</p> : null}
      </section>
    </main>
  );
}
