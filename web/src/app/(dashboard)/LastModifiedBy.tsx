"use client";
import { useEffect, useState } from "react";
import { User, Clock } from "lucide-react";

type Entry = { id: string; actorName: string; action: string; createdAt: string };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)         return "à l'instant";
  if (diff < 3_600_000)      return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000)     return `il y a ${Math.floor(diff / 3_600_000)} h`;
  if (diff < 7 * 86_400_000) return `il y a ${Math.floor(diff / 86_400_000)} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function LastModifiedBy({
  entityType,
  entityId,
}: {
  entityType: "order" | "product";
  entityId:   string;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded,  setLoaded]  = useState(false);

  useEffect(() => {
    if (!entityId) return;
    setLoaded(false);
    fetch(`/api/audit/entity?entityType=${entityType}&entityId=${encodeURIComponent(entityId)}`)
      .then(r => r.json())
      .then(d => setEntries(d.entries ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [entityType, entityId]);

  if (!loaded || entries.length === 0) return null;

  const last = entries[0];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 12px",
      background: "#F8FAF9",
      border: "1px solid #E8ECEA",
      borderRadius: 10,
      marginBottom: 14,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 8,
        background: "#EAF7EF", color: "#0A8F45",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <User size={13} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, color: "#667085" }}>
          Dernière modification par{" "}
          <strong style={{ color: "#1F2A24" }}>{last.actorName}</strong>
        </span>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          fontSize: 11, color: "#98A2B3", marginLeft: 8,
        }}>
          <Clock size={9} />
          {timeAgo(last.createdAt)}
        </span>
      </div>
      {entries.length > 1 && (
        <span style={{
          fontSize: 10, color: "#98A2B3",
          background: "#F2F4F7", borderRadius: 20,
          padding: "2px 7px", whiteSpace: "nowrap", flexShrink: 0,
        }}>
          +{entries.length - 1} autre{entries.length > 2 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
