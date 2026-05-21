"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActiveShop } from "@/hooks/useActiveShop";
import { Users, RefreshCw, ChevronUp, ChevronDown, Store, UserPlus, X, Download } from "lucide-react";

type Customer = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
};

type ApiShop = {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
  _count: { orders: number; products: number; customers: number };
};

type SortField = "name" | "date" | "phone";
type SortDir   = "asc" | "desc";

const CSS = `
.cu-wrap  { padding:24px 28px; max-width:1280px; margin:0 auto; background:#F8FAF9; min-height:100vh; }
.cu-ctx   { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-bottom:16px; }
.cu-ctx-r { margin-left:auto; display:flex; gap:8px; }
.cu-kpi   { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:16px; }
.cu-main  { display:grid; grid-template-columns:1fr 340px; gap:18px; }
.cu-tcard { background:#fff; border:1px solid #E8ECEA; border-radius:18px;
            box-shadow:0 2px 10px rgba(16,24,40,.04); overflow:hidden; }
.cu-tbar  { display:flex; align-items:center; gap:10px; padding:16px 20px;
            border-bottom:1px solid #E8ECEA; flex-wrap:wrap; }
.cu-tacts { display:flex; gap:8px; margin-left:auto; }
.cu-ftrow { display:flex; gap:8px; padding:12px 20px; border-bottom:1px solid #E8ECEA; flex-wrap:wrap; }
.cu-table { width:100%; border-collapse:collapse; font-size:13px; }
.cu-table th { padding:9px 12px; text-align:left; color:#667085; font-weight:500;
               border-bottom:1px solid #E8ECEA; background:#FAFBFA; white-space:nowrap; cursor:pointer; user-select:none; }
.cu-table th:hover { color:#1F2A24; }
.cu-table td { padding:10px 12px; border-bottom:1px solid #F4F6F5; color:#1F2A24; vertical-align:middle; }
.cu-table tr:hover td { background:#FAFBFA; }
.cu-table tr:last-child td { border-bottom:none; }
.cu-card  { background:#fff; border:1px solid #E8ECEA; border-radius:18px;
            padding:18px 20px; box-shadow:0 2px 10px rgba(16,24,40,.04); }
.cu-form  { display:flex; flex-direction:column; gap:12px; }
.cu-field { display:flex; flex-direction:column; gap:5px; }
.cu-label { font-size:12px; font-weight:600; color:#1F2A24; }
.cu-inp   { height:36px; padding:0 11px; border:1px solid #E8ECEA; border-radius:10px;
            font-size:13px; color:#1F2A24; background:#fff; outline:none; width:100%; box-sizing:border-box; }
.cu-inp:focus { border-color:#0A8F45; box-shadow:0 0 0 3px rgba(10,143,69,.08); }
.cu-ta    { padding:8px 11px; border:1px solid #E8ECEA; border-radius:10px;
            font-size:13px; color:#1F2A24; background:#fff; outline:none; width:100%; box-sizing:border-box;
            resize:vertical; font-family:inherit; }
.cu-ta:focus { border-color:#0A8F45; box-shadow:0 0 0 3px rgba(10,143,69,.08); }
.inp  { height:36px; padding:0 11px; border:1px solid #E8ECEA; border-radius:10px;
        font-size:13px; color:#1F2A24; background:#fff; outline:none; }
.inp:focus { border-color:#0A8F45; }
.sel  { height:36px; padding:0 9px; border:1px solid #E8ECEA; border-radius:10px;
        font-size:12px; color:#1F2A24; background:#fff; cursor:pointer; outline:none; }
.btn-primary   { height:34px; padding:0 14px; background:#0A8F45; color:#fff; border:none;
                 border-radius:10px; font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap; }
.btn-primary:hover { background:#08763A; }
.btn-primary:disabled { opacity:.5; cursor:not-allowed; }
.btn-secondary { height:34px; padding:0 12px; background:#fff; color:#1F2A24;
                 border:1px solid #E8ECEA; border-radius:10px; font-size:12px; cursor:pointer; white-space:nowrap; }
.btn-secondary:hover { background:#F8FAF9; }
.pag { display:flex; align-items:center; justify-content:space-between;
       padding:11px 20px; border-top:1px solid #E8ECEA; flex-wrap:wrap; gap:8px; }
.pag-info { font-size:12px; color:#98A2B3; }
.pag-btns { display:flex; align-items:center; gap:4px; }
.pag-btn  { min-width:32px; height:28px; padding:0 8px; border:1px solid #E8ECEA; border-radius:8px;
            background:#fff; color:#1F2A24; font-size:12px; cursor:pointer; font-weight:500; }
.pag-btn:hover:not(:disabled) { background:#F8FAF9; border-color:#0A8F45; color:#0A8F45; }
.pag-btn:disabled { opacity:.4; cursor:default; }
.pag-btn.active { background:#0A8F45; color:#fff; border-color:#0A8F45; font-weight:700; }
@media(max-width:1100px){ .cu-kpi{grid-template-columns:repeat(2,1fr);} .cu-main{grid-template-columns:1fr;} }
@media(max-width:700px){ .cu-kpi{grid-template-columns:1fr 1fr;} .cu-wrap{padding:14px 12px;}
  .cu-ctx{flex-direction:column;align-items:flex-start;} .cu-ctx-r{margin-left:0;} }
`;

function downloadCSV(rows: string[][], filename: string) {
  const content = rows
    .map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = 25;
function Paginator({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return (
    <div className="pag"><span className="pag-info">{total} résultat{total !== 1 ? "s" : ""}</span></div>
  );
  const start = (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, total);
  const range = Array.from(new Set([1, pages, page - 1, page, page + 1].filter(n => n >= 1 && n <= pages))).sort((a,b) => a-b);
  const nums: (number|"…")[] = [];
  for (let i = 0; i < range.length; i++) {
    if (i > 0 && range[i] - range[i-1] > 1) nums.push("…");
    nums.push(range[i]);
  }
  return (
    <div className="pag">
      <span className="pag-info">{start}–{end} sur {total}</span>
      <div className="pag-btns">
        <button className="pag-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>‹</button>
        {nums.map((n, i) => n === "…"
          ? <span key={`e${i}`} style={{ padding:"0 4px", color:"#98A2B3", fontSize:12 }}>…</span>
          : <button key={n} className={`pag-btn${n === page ? " active" : ""}`} onClick={() => onChange(n as number)}>{n}</button>
        )}
        <button className="pag-btn" disabled={page >= pages} onClick={() => onChange(page + 1)}>›</button>
      </div>
    </div>
  );
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (field !== sortField) return <ChevronDown size={12} style={{ opacity: 0.3, marginLeft: 3, verticalAlign: "middle" }} />;
  return sortDir === "asc"
    ? <ChevronUp size={12} style={{ color: "#0A8F45", marginLeft: 3, verticalAlign: "middle" }} />
    : <ChevronDown size={12} style={{ color: "#0A8F45", marginLeft: 3, verticalAlign: "middle" }} />;
}

export default function CustomersPage() {
  const [activeShopId, setActiveShopId] = useActiveShop("");
  const [shops, setShops]               = useState<ApiShop[]>([]);
  const [customers, setCustomers]       = useState<Customer[]>([]);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState("");
  const [sortField, setSortField]       = useState<SortField>("date");
  const [sortDir, setSortDir]           = useState<SortDir>("desc");
  const [formOpen, setFormOpen]         = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [formErr, setFormErr]           = useState<string | null>(null);
  const [page, setPage]                 = useState(1);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone]       = useState("");
  const [email, setEmail]       = useState("");
  const [address, setAddress]   = useState("");
  const [notes, setNotes]       = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeShop  = shops.find(s => s.id === activeShopId) ?? null;

  useEffect(() => {
    fetch("/api/shop?all=1")
      .then(r => r.json())
      .then(data => {
        const list: ApiShop[] = Array.isArray(data.data) ? data.data : [];
        setShops(list);
        const stored = typeof window !== "undefined" ? (localStorage.getItem("biz_active_shop_id") ?? "") : "";
        if (list.length > 0 && !list.find(s => s.id === stored)) {
          setActiveShopId(list[0].id);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeShopId) return;
    fetchCustomers(activeShopId, search);
  }, [activeShopId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeShopId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCustomers(activeShopId, search);
    }, 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, activeShopId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchCustomers(shopId: string, q: string) {
    if (!shopId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ shopId });
      if (q.trim()) params.set("q", q.trim());
      const res  = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data.data)) setCustomers(data.data);
    } catch {}
    setLoading(false);
  }

  function toggleSort(field: SortField) {
    if (field === sortField) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    const list = [...customers];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name")  cmp = a.fullName.localeCompare(b.fullName, "fr");
      if (sortField === "phone") cmp = a.phone.localeCompare(b.phone);
      if (sortField === "date")  cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [customers, sortField, sortDir]);

  useEffect(() => { setPage(1); }, [search, sortField, sortDir]); // eslint-disable-line react-hooks/exhaustive-deps

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetForm() {
    setFullName(""); setPhone(""); setEmail(""); setAddress(""); setNotes("");
    setFormErr(null);
  }

  async function handleCreate() {
    if (fullName.trim().length < 2) { setFormErr("Nom trop court (2 caractères minimum)."); return; }
    if (phone.trim().length < 8)    { setFormErr("Numéro trop court (8 caractères minimum)."); return; }
    setSubmitting(true); setFormErr(null);
    try {
      const params = new URLSearchParams({ shopId: activeShopId });
      const res = await fetch(`/api/customers?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone:    phone.trim(),
          email:    email.trim() || undefined,
          address:  address.trim() || undefined,
          notes:    notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");
      resetForm();
      setFormOpen(false);
      fetchCustomers(activeShopId, search);
    } catch (e) {
      setFormErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleExportCSV() {
    const shopName = activeShop?.name ?? "boutique";
    const date     = new Date().toISOString().slice(0, 10);
    const headers  = ["Nom", "Téléphone", "Email", "Adresse", "Notes", "Inscrit le"];
    const rows     = filtered.map(c => [
      c.fullName,
      c.phone,
      c.email ?? "",
      c.address ?? "",
      c.notes ?? "",
      c.createdAt.slice(0, 10),
    ]);
    downloadCSV([headers, ...rows], `clients_${shopName}_${date}.csv`);
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="cu-wrap">

        {/* Context bar */}
        <div className="cu-ctx">
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:12, color:"#667085", fontWeight:500 }}>Boutique active</span>
            <select
              className="sel"
              style={{ fontWeight:700, color:"#0A8F45", borderColor:"#0A8F45", minWidth:155 }}
              value={activeShopId}
              onChange={e => setActiveShopId(e.target.value)}>
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ fontSize:12, color:"#98A2B3" }}>
            {customers.length} client{customers.length !== 1 ? "s" : ""}
          </div>
          <div className="cu-ctx-r">
            <button
              className="btn-secondary"
              style={{ display:"flex", alignItems:"center", gap:5 }}
              onClick={() => fetchCustomers(activeShopId, search)}
              disabled={loading}>
              {loading ? "…" : <><RefreshCw size={12} /> Actualiser</>}
            </button>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom:16 }}>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#1F2A24", margin:"0 0 4px" }}>Clients</h1>
          <p style={{ margin:0, color:"#667085", fontSize:14 }}>
            Base clients de <strong style={{ color:"#0A8F45" }}>{activeShop?.name ?? "votre boutique"}</strong>
          </p>
        </div>

        {/* KPIs */}
        <div className="cu-kpi">
          {[
            { icon:<Users size={16} color="#0A8F45" />,   l:"Total clients",       v: String(customers.length) },
            { icon:<Users size={16} color="#3B82F6" />,   l:"Résultats filtrés",   v: String(filtered.length) },
            { icon:<Store size={16} color="#F08A24" />,   l:"Boutique",            v: activeShop?.name ?? "—" },
            { icon:<Users size={16} color="#8B5CF6" />,   l:"Avec email",          v: String(customers.filter(c => c.email).length) },
          ].map((k, i) => (
            <div key={i} style={{ background:"#fff", border:"1px solid #E8ECEA", borderRadius:16,
              padding:"16px 18px", boxShadow:"0 2px 10px rgba(16,24,40,.04)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                <span style={{ fontSize:13, color:"#667085", fontWeight:500 }}>{k.l}</span>
                {k.icon}
              </div>
              <div style={{ fontSize:20, fontWeight:800, color:"#1F2A24", letterSpacing:"-0.5px",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* Main 2-col */}
        <div className="cu-main">

          {/* Table */}
          <div className="cu-tcard">
            <div className="cu-tbar">
              <div>
                <div style={{ fontWeight:700, color:"#1F2A24", fontSize:15 }}>Base clients</div>
                <div style={{ fontSize:11, color:"#98A2B3", marginTop:2 }}>
                  {filtered.length} sur {customers.length}
                </div>
              </div>
              <div className="cu-tacts">
                <button className="btn-secondary" onClick={handleExportCSV}
                  disabled={filtered.length === 0}
                  style={{ display:"flex", alignItems:"center", gap:5 }}
                  title={`Exporter ${filtered.length} client${filtered.length !== 1 ? "s" : ""} en CSV`}>
                  <Download size={13} /> Exporter
                </button>
                <button
                  className="btn-primary"
                  style={{ display:"flex", alignItems:"center", gap:5 }}
                  onClick={() => { setFormOpen(true); setFormErr(null); }}
                  disabled={!activeShopId}>
                  <UserPlus size={13} /> Nouveau client
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="cu-ftrow">
              <input
                className="inp"
                placeholder="🔍 Nom, téléphone, email…"
                style={{ flex:1, minWidth:140 }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className="sel"
                value={`${sortField}-${sortDir}`}
                onChange={e => {
                  const [f, d] = e.target.value.split("-") as [SortField, SortDir];
                  setSortField(f); setSortDir(d);
                }}>
                <option value="date-desc">Plus récents</option>
                <option value="date-asc">Plus anciens</option>
                <option value="name-asc">Nom A → Z</option>
                <option value="name-desc">Nom Z → A</option>
                <option value="phone-asc">Téléphone ↑</option>
              </select>
              {search && (
                <button
                  className="btn-secondary"
                  style={{ display:"flex", alignItems:"center", gap:4 }}
                  onClick={() => setSearch("")}>
                  <X size={12} /> Effacer
                </button>
              )}
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ textAlign:"center", padding:40, color:"#98A2B3", fontSize:14 }}>
                Chargement des clients…
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table className="cu-table">
                  <thead>
                    <tr>
                      <th onClick={() => toggleSort("name")}>
                        Nom <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th onClick={() => toggleSort("phone")}>
                        Téléphone <SortIcon field="phone" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th>Email</th>
                      <th>Adresse</th>
                      <th onClick={() => toggleSort("date")}>
                        Inscrit le <SortIcon field="date" sortField={sortField} sortDir={sortDir} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight:600, fontSize:13 }}>{c.fullName}</div>
                          {c.notes && (
                            <div style={{ fontSize:11, color:"#98A2B3", marginTop:2, fontStyle:"italic" }}>
                              {c.notes.slice(0, 60)}{c.notes.length > 60 ? "…" : ""}
                            </div>
                          )}
                        </td>
                        <td style={{ fontFamily:"monospace", fontSize:12 }}>{c.phone}</td>
                        <td style={{ fontSize:12, color:"#667085" }}>{c.email ?? "—"}</td>
                        <td style={{ fontSize:12, color:"#667085", maxWidth:180 }}>
                          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block" }}>
                            {c.address ?? "—"}
                          </span>
                        </td>
                        <td style={{ fontSize:11, color:"#98A2B3", whiteSpace:"nowrap" }}>
                          {c.createdAt.slice(0, 10)}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign:"center", padding:32, color:"#98A2B3" }}>
                          {customers.length === 0
                            ? "Aucun client pour cette boutique."
                            : "Aucun client ne correspond à la recherche."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <Paginator page={page} total={filtered.length} onChange={setPage} />
          </div>

          {/* Right sidebar */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Nouveau client form */}
            <div className="cu-card">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ fontWeight:700, color:"#1F2A24", fontSize:14 }}>
                  {formOpen ? "Nouveau client" : "Ajouter un client"}
                </div>
                {!formOpen && (
                  <button
                    className="btn-primary"
                    style={{ display:"flex", alignItems:"center", gap:4, height:30, fontSize:11 }}
                    onClick={() => { setFormOpen(true); setFormErr(null); }}>
                    <UserPlus size={12} /> Ajouter
                  </button>
                )}
              </div>

              {formOpen ? (
                <div className="cu-form">
                  <div className="cu-field">
                    <label className="cu-label">Nom complet *</label>
                    <input className="cu-inp" placeholder="Prénom Nom"
                      value={fullName} onChange={e => setFullName(e.target.value)} />
                  </div>
                  <div className="cu-field">
                    <label className="cu-label">Téléphone *</label>
                    <input className="cu-inp" placeholder="+221771234567"
                      value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div className="cu-field">
                    <label className="cu-label">Email</label>
                    <input className="cu-inp" type="email" placeholder="Optionnel"
                      value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="cu-field">
                    <label className="cu-label">Adresse</label>
                    <input className="cu-inp" placeholder="Optionnel"
                      value={address} onChange={e => setAddress(e.target.value)} />
                  </div>
                  <div className="cu-field">
                    <label className="cu-label">Notes</label>
                    <textarea className="cu-ta" rows={2} placeholder="Optionnel"
                      value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>
                  {formErr && (
                    <div style={{ padding:"8px 10px", background:"#FDE8E8", borderRadius:8,
                      fontSize:12, color:"#D92D20" }}>{formErr}</div>
                  )}
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="btn-secondary" style={{ flex:1 }}
                      onClick={() => { setFormOpen(false); resetForm(); }}>Annuler</button>
                    <button className="btn-primary" style={{ flex:1 }}
                      onClick={handleCreate} disabled={submitting}>
                      {submitting ? "Création…" : "Créer"}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize:12, color:"#98A2B3", textAlign:"center", padding:"8px 0" }}>
                  Cliquez sur Ajouter pour créer un nouveau client dans cette boutique.
                </div>
              )}
            </div>

            {/* Boutique info */}
            <div className="cu-card">
              <div style={{ fontWeight:700, color:"#1F2A24", fontSize:14, marginBottom:12 }}>Boutique active</div>
              {activeShop ? (
                <>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:"#EAF7EF",
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Store size={18} color="#0A8F45" />
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:"#1F2A24" }}>{activeShop.name}</div>
                      <span style={{ fontSize:10, padding:"2px 7px", borderRadius:10, fontWeight:600,
                        background: activeShop.isPublished ? "#DDF6E7" : "#F2F4F7",
                        color: activeShop.isPublished ? "#0A8F45" : "#667085" }}>
                        {activeShop.isPublished ? "Publiée" : "Brouillon"}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                    {[
                      { l:"Clients",   v: activeShop._count.customers },
                      { l:"Produits",  v: activeShop._count.products },
                      { l:"Commandes", v: activeShop._count.orders },
                      { l:"Avec email",v: customers.filter(c => c.email).length },
                    ].map(r => (
                      <div key={r.l} style={{ background:"#F8FAF9", borderRadius:8, padding:"7px 10px" }}>
                        <div style={{ fontSize:15, fontWeight:700, color:"#1F2A24" }}>{r.v}</div>
                        <div style={{ fontSize:10, color:"#98A2B3" }}>{r.l}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ fontSize:12, color:"#98A2B3" }}>Chargement…</div>
              )}
            </div>

            {/* Other shops */}
            {shops.length > 1 && (
              <div className="cu-card">
                <div style={{ fontWeight:700, color:"#1F2A24", fontSize:14, marginBottom:10 }}>Mes boutiques</div>
                {shops.map((s, i) => {
                  const colors = ["#0A8F45","#3B82F6","#F08A24","#8B5CF6","#EC4899"];
                  return (
                    <div key={s.id}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px",
                        borderBottom: i < shops.length - 1 ? "1px solid #F4F6F5" : "none",
                        borderRadius:8, cursor:"pointer",
                        background: s.id === activeShopId ? "#EAF7EF" : "transparent" }}
                      onClick={() => setActiveShopId(s.id)}>
                      <div style={{ width:32, height:32, borderRadius:9, background:colors[i % colors.length],
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontWeight:700, fontSize:11, color:"#fff", flexShrink:0 }}>
                        {s.name.slice(0,2).toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:12, color:"#1F2A24",
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize:10, color:"#98A2B3" }}>{s._count.customers} clients</div>
                      </div>
                      {s.id === activeShopId && (
                        <span style={{ fontSize:9, background:"#0A8F45", color:"#fff",
                          borderRadius:4, padding:"1px 5px", flexShrink:0 }}>Actif</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
