"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { admin } from "@/lib/admin";
import type { Review, ReviewPhoto } from "@/lib/types";
import Modal from "@/components/Modal";
import { useToast } from "@/hooks/useToast";

function Stars({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            fontSize: 14,
            lineHeight: 1,
            color: n <= value ? "var(--accent)" : "var(--border)",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function PhotosCell({
  reviewId,
  onDeletePhoto,
}: {
  reviewId: string;
  onDeletePhoto: (photoId: string) => void;
}) {
  const { session } = useAuth();
  const [photos, setPhotos] = useState<ReviewPhoto[] | null>(null);

  const load = useCallback(() => {
    if (!session) return;
    admin
      .reviewPhotosByReview(session, reviewId)
      .then(setPhotos)
      .catch(() => setPhotos([]));
  }, [session, reviewId]);

  useEffect(() => {
    load();
  }, [load]);

  if (photos === null) {
    return (
      <span className="mono mute" style={{ fontSize: 11 }}>
        …
      </span>
    );
  }

  if (photos.length === 0) {
    return (
      <span className="mono mute" style={{ fontSize: 11 }}>
        —
      </span>
    );
  }

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {photos
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((ph) => (
          <div
            key={ph.id}
            style={{
              position: "relative",
              width: 40,
              height: 40,
              borderRadius: 4,
              overflow: "hidden",
              background: "var(--card)",
            }}
          >
            <a href={ph.url} target="_blank" rel="noopener noreferrer">
              <img
                src={ph.url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </a>
            <button
              onClick={() => {
                onDeletePhoto(ph.id);
                setPhotos(
                  (prev) => prev?.filter((p) => p.id !== ph.id) ?? null,
                );
              }}
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                background: "rgba(0,0,0,0.7)",
                border: "none",
                color: "#fff",
                borderRadius: 3,
                cursor: "pointer",
                padding: "0 4px",
                fontSize: 10,
                lineHeight: "16px",
              }}
              title="Eliminar foto"
            >
              ✕
            </button>
          </div>
        ))}
    </div>
  );
}

export default function AdminReviewsClient() {
  const { session } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { show: addToast, ToastContainer } = useToast();

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const data = await admin.listReviews(session);
      setReviews(data);
    } catch (e: any) {
      setError(e.message ?? "Error al cargar las reviews.");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDeleteReview() {
    if (!session || !confirmDelete) return;
    setDeleting(true);
    try {
      await admin.deleteReview(session, confirmDelete.id);
      addToast("Review eliminada.", "success");
      setReviews((prev) => prev.filter((r) => r.id !== confirmDelete.id));
    } catch (e: any) {
      addToast(e.message ?? "Error al eliminar la review.", "error");
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!session) return;
    try {
      await admin.deleteReviewPhoto(session, photoId);
      addToast("Foto eliminada.", "success");
    } catch (e: any) {
      addToast(e.message ?? "Error al eliminar la foto.", "error");
    }
  }

  const filtered = useMemo(() => {
    let list = reviews;
    if (filterRating) list = list.filter((r) => r.rating === filterRating);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.productName.toLowerCase().includes(q) ||
          `${r.userFirstName} ${r.userLastName}`.toLowerCase().includes(q) ||
          r.body.toLowerCase().includes(q),
      );
    }
    return list;
  }, [reviews, filterRating, search]);

  return (
    <div style={{ padding: "32px 32px 64px" }}>
      <div
        style={{
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          className="mono mute"
          style={{ fontSize: 11, letterSpacing: "0.14em", marginBottom: 8 }}
        >
          ◆ OPERACIONES
        </div>
        <h1 className="display" style={{ fontSize: 40 }}>
          REVIEWS
        </h1>
      </div>

      {error && (
        <div
          className="mono"
          style={{ color: "var(--red, #e55)", fontSize: 12, marginBottom: 24 }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 24,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          className="input"
          placeholder="Buscar por producto, comprador o texto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <button
          className="btn btn-ghost"
          style={{
            fontSize: 12,
            padding: "6px 12px",
            background: filterRating === null ? "var(--card)" : "transparent",
          }}
          onClick={() => setFilterRating(null)}
        >
          Todas
        </button>
        {[5, 4, 3, 2, 1].map((n) => (
          <button
            key={n}
            className="btn btn-ghost"
            style={{
              fontSize: 12,
              padding: "6px 12px",
              background: filterRating === n ? "var(--card)" : "transparent",
            }}
            onClick={() => setFilterRating(n)}
          >
            {n}★
          </button>
        ))}
        <span
          className="mono mute"
          style={{ fontSize: 11, marginLeft: "auto" }}
        >
          {filtered.length} de {reviews.length}
        </span>
      </div>

      {loading ? (
        <div className="mono mute" style={{ padding: 48, textAlign: "center" }}>
          Cargando…
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div className="display" style={{ fontSize: 20 }}>
            No hay reviews que coincidan.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Comprador</th>
                <th>Rating</th>
                <th>Comentario</th>
                <th>Fotos</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ minWidth: 140 }}>{r.productName}</td>
                  <td style={{ minWidth: 140 }}>
                    {r.userFirstName} {r.userLastName}
                    {r.isVerifiedPurchase && (
                      <div>
                        <span className="pill green" style={{ fontSize: 10 }}>
                          ✓ Verificada
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    <Stars value={r.rating} />
                  </td>
                  <td style={{ maxWidth: 320 }}>
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--text-dim)",
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={r.body}
                    >
                      {r.body}
                    </span>
                  </td>
                  <td style={{ minWidth: 100 }}>
                    <PhotosCell
                      reviewId={r.id}
                      onDeletePhoto={handleDeletePhoto}
                    />
                  </td>
                  <td
                    className="mono mute"
                    style={{ fontSize: 11, whiteSpace: "nowrap" }}
                  >
                    {new Date(r.createdAt).toLocaleDateString("es-SV", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      style={{
                        fontSize: 12,
                        padding: "6px 12px",
                        color: "var(--red, #e55)",
                      }}
                      onClick={() => setConfirmDelete(r)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!confirmDelete}
        title="ELIMINAR REVIEW"
        onClose={() => setConfirmDelete(null)}
        width={420}
      >
        <p style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 24 }}>
          ¿Seguro que querés eliminar la review de{" "}
          <strong>
            {confirmDelete?.userFirstName} {confirmDelete?.userLastName}
          </strong>{" "}
          sobre <strong>{confirmDelete?.productName}</strong>? También se
          eliminarán todas sus fotos. Esta acción no se puede deshacer.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            className="btn btn-ghost"
            onClick={() => setConfirmDelete(null)}
          >
            Cancelar
          </button>
          <button
            className="btn"
            style={{
              background: "var(--red, #e55)",
              borderColor: "var(--red, #e55)",
            }}
            onClick={handleDeleteReview}
            disabled={deleting}
          >
            {deleting ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </Modal>
      <ToastContainer />
    </div>
  );
}
