"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth, getUserId } from "@/lib/auth";
import {
  getReviewsByUser,
  getReviewPhotosByReview,
  createReview,
  patchReview,
  deleteReview,
  createReviewPhoto,
  deleteReviewPhoto,
  getPublicProducts,
  uploadReviewPhoto,
} from "@/lib/api";
import type { Review, ReviewPhoto, Product } from "@/lib/types";
import Modal from "@/components/Modal";
import { useToast } from "@/hooks/useToast";

function Stars({
  value,
  onChange,
}: {
  value: number;
  onChange?: (n: number) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          style={{
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: onChange ? "pointer" : "default",
            color: n <= value ? "var(--accent)" : "var(--border)",
            padding: 0,
            lineHeight: 1,
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function CreateReviewModal({
  open,
  products,
  userId,
  token,
  onClose,
  onCreated,
}: {
  open: boolean;
  products: Product[];
  userId: string;
  token: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [productId, setProductId] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { show: addToast } = useToast();

  function reset() {
    setProductId("");
    setRating(5);
    setBody("");
    setErr("");
    setFiles([]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    setFiles((prev) => [...prev, ...dropped].slice(0, 5));
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    setFiles((prev) => [...prev, ...selected].slice(0, 5));
    e.target.value = "";
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    if (!productId) return setErr("Seleccioná un producto.");
    if (body.length < 10)
      return setErr("El comentario debe tener al menos 10 caracteres.");
    setSaving(true);
    try {
      const review = await createReview(
        { productId, userId, rating, body, isVerifiedPurchase: false },
        token,
      );
      if (files.length > 0) {
        await Promise.all(
          files.map(async (file, i) => {
            const url = await uploadReviewPhoto(file, token);
            await createReviewPhoto(
              { reviewId: review.id, url, sortOrder: i },
              token,
            );
          }),
        );
      }
      addToast("Review publicada.", "success");
      reset();
      onCreated();
      onClose();
    } catch (e: any) {
      setErr(e.message ?? "Error al crear la review.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="NUEVA REVIEW"
      onClose={() => {
        reset();
        onClose();
      }}
      width={560}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            PRODUCTO
          </div>
          <select
            className="input"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">— Seleccioná —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            CALIFICACIÓN
          </div>
          <Stars value={rating} onChange={setRating} />
        </div>

        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            COMENTARIO
          </div>
          <textarea
            className="input"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Mínimo 10 caracteres..."
            style={{ resize: "vertical" }}
          />
          <div className="mono mute" style={{ fontSize: 11, marginTop: 4 }}>
            {body.length} / 2000
          </div>
        </div>

        {/* Fotos */}
        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            FOTOS (máx. 5)
          </div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${drag ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 4,
              padding: 20,
              textAlign: "center",
              cursor: "pointer",
              background: drag ? "var(--card)" : "transparent",
              transition: "all 150ms",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFileInput}
            />
            <div className="mono mute" style={{ fontSize: 13 }}>
              Arrastrá fotos acá o hacé clic · PNG · JPG · WEBP
            </div>
          </div>

          {files.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 8,
                marginTop: 10,
              }}
            >
              {files.map((f, i) => (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    aspectRatio: "1",
                    background: "var(--card)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={URL.createObjectURL(f)}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      background: "rgba(0,0,0,0.7)",
                      border: "none",
                      color: "#fff",
                      borderRadius: 3,
                      cursor: "pointer",
                      padding: "2px 6px",
                      fontSize: 11,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {err && (
          <div
            className="mono"
            style={{ color: "var(--red, #e55)", fontSize: 12 }}
          >
            {err}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            className="btn btn-ghost"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancelar
          </button>
          <button className="btn" onClick={handleSubmit} disabled={saving}>
            {saving ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function EditReviewModal({
  review,
  token,
  onClose,
  onSaved,
}: {
  review: Review | null;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(review?.rating ?? 5);
  const [body, setBody] = useState(review?.body ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const { show: addToast } = useToast();

  useEffect(() => {
    if (review) {
      setRating(review.rating);
      setBody(review.body);
      setErr("");
    }
  }, [review]);

  async function handleSave() {
    if (!review) return;
    if (body.length < 10)
      return setErr("El comentario debe tener al menos 10 caracteres.");
    setSaving(true);
    try {
      await patchReview(review.id, { rating, body }, token);
      addToast("Review actualizada.", "success");
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e.message ?? "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!!review} title="EDITAR REVIEW" onClose={onClose} width={520}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            CALIFICACIÓN
          </div>
          <Stars value={rating} onChange={setRating} />
        </div>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            COMENTARIO
          </div>
          <textarea
            className="input"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={{ resize: "vertical" }}
          />
          <div className="mono mute" style={{ fontSize: 11, marginTop: 4 }}>
            {body.length} / 2000
          </div>
        </div>
        {err && (
          <div
            className="mono"
            style={{ color: "var(--red, #e55)", fontSize: 12 }}
          >
            {err}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PhotosModal({
  review,
  token,
  onClose,
}: {
  review: Review | null;
  token: string;
  onClose: () => void;
}) {
  const [photos, setPhotos] = useState<ReviewPhoto[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { show: addToast } = useToast();

  const load = useCallback(async () => {
    if (!review) return;
    const data = await getReviewPhotosByReview(review.id);
    setPhotos(data);
  }, [review]);

  useEffect(() => {
    if (review) {
      load();
      setFiles([]);
      setErr("");
    }
  }, [review, load]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    setFiles((prev) => [...prev, ...dropped].slice(0, 5));
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    setFiles((prev) => [...prev, ...selected].slice(0, 5));
    e.target.value = "";
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleAdd() {
    if (!review || files.length === 0)
      return setErr("Seleccioná al menos una foto.");
    setLoading(true);
    try {
      await Promise.all(
        files.map(async (file, i) => {
          const url = await uploadReviewPhoto(file, token);
          await createReviewPhoto(
            { reviewId: review.id, url, sortOrder: photos.length + i },
            token,
          );
        }),
      );
      addToast("Fotos agregadas.", "success");
      setFiles([]);
      load();
    } catch (e: any) {
      setErr(e.message ?? "Error al agregar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePhoto(photoId: string) {
    try {
      await deleteReviewPhoto(photoId, token);
      addToast("Foto eliminada.", "success");
      load();
    } catch (e: any) {
      addToast(e.message ?? "Error al eliminar.", "error");
    }
  }

  return (
    <Modal
      open={!!review}
      title={`FOTOS · ${review?.productName ?? ""}`}
      onClose={onClose}
      width={600}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Fotos existentes */}
        {photos.length === 0 ? (
          <div
            className="mono mute"
            style={{ fontSize: 13, textAlign: "center", padding: "16px 0" }}
          >
            Sin fotos aún.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            {photos.map((ph) => (
              <div
                key={ph.id}
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  background: "var(--card)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <img
                  src={ph.url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
                <button
                  onClick={() => handleDeletePhoto(ph.id)}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: "rgba(0,0,0,0.7)",
                    border: "none",
                    color: "#fff",
                    borderRadius: 3,
                    cursor: "pointer",
                    padding: "2px 7px",
                    fontSize: 12,
                  }}
                >
                  ✕
                </button>
                <div
                  className="mono mute"
                  style={{
                    position: "absolute",
                    bottom: 4,
                    left: 6,
                    fontSize: 10,
                  }}
                >
                  #{ph.sortOrder}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agregar fotos */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <div className="label" style={{ marginBottom: 10 }}>
            AGREGAR FOTOS (máx. 5)
          </div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${drag ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 4,
              padding: 16,
              textAlign: "center",
              cursor: "pointer",
              background: drag ? "var(--card)" : "transparent",
              transition: "all 150ms",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFileInput}
            />
            <div className="mono mute" style={{ fontSize: 13 }}>
              Arrastrá fotos acá o hacé clic · PNG · JPG · WEBP
            </div>
          </div>

          {files.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 8,
                marginTop: 10,
              }}
            >
              {files.map((f, i) => (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    aspectRatio: "1",
                    background: "var(--card)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={URL.createObjectURL(f)}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      background: "rgba(0,0,0,0.7)",
                      border: "none",
                      color: "#fff",
                      borderRadius: 3,
                      cursor: "pointer",
                      padding: "2px 6px",
                      fontSize: 11,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {err && (
            <div
              className="mono"
              style={{ color: "var(--red, #e55)", fontSize: 12, marginTop: 8 }}
            >
              {err}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 12,
            }}
          >
            <button
              className="btn"
              onClick={handleAdd}
              disabled={loading || files.length === 0}
            >
              {loading
                ? "Subiendo…"
                : `Subir ${files.length > 0 ? files.length : ""} foto${files.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function ReviewsTab() {
  const { session } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [photosTarget, setPhotosTarget] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { show: addToast } = useToast();

  const userId = session ? getUserId(session) : null;

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [rev, prods] = await Promise.all([
        getReviewsByUser(userId),
        getPublicProducts(),
      ]);
      setReviews(rev);
      setProducts(prods);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!session) return;
    setDeleting(id);
    try {
      await deleteReview(id, session.accessToken);
      addToast("Review eliminada.", "success");
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      addToast(e.message ?? "Error al eliminar.", "error");
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  }

  if (!session || !userId) return null;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div className="display" style={{ fontSize: 24 }}>
          MIS REVIEWS · {reviews.length}
        </div>
        <button className="btn" onClick={() => setShowCreate(true)}>
          + Nueva review
        </button>
      </div>

      {loading ? (
        <div className="mono mute" style={{ padding: 48, textAlign: "center" }}>
          Cargando…
        </div>
      ) : reviews.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div className="display" style={{ fontSize: 20 }}>
            Todavía no escribiste ninguna review.
          </div>
          <button
            className="btn"
            style={{ marginTop: 16 }}
            onClick={() => setShowCreate(true)}
          >
            Escribir tu primera review
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reviews.map((r) => (
            <div key={r.id} className="card" style={{ padding: "20px 24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div
                    className="display"
                    style={{ fontSize: 15, marginBottom: 4 }}
                  >
                    {r.productName}
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <Stars value={r.rating} />
                    {r.isVerifiedPurchase && (
                      <span className="pill green" style={{ fontSize: 11 }}>
                        ✓ Verificada
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="mono mute"
                  style={{ fontSize: 11, textAlign: "right" }}
                >
                  {new Date(r.createdAt).toLocaleDateString("es-SV", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>

              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-dim)",
                  lineHeight: 1.6,
                  margin: "0 0 16px",
                }}
              >
                {r.body}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  borderTop: "1px solid var(--border)",
                  paddingTop: 14,
                }}
              >
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 12, padding: "6px 12px" }}
                  onClick={() => setEditing(r)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 12, padding: "6px 12px" }}
                  onClick={() => setPhotosTarget(r)}
                >
                  Fotos
                </button>
                <button
                  className="btn btn-ghost"
                  style={{
                    fontSize: 12,
                    padding: "6px 12px",
                    color: "var(--red, #e55)",
                    marginLeft: "auto",
                  }}
                  onClick={() => setConfirmDelete(r.id)}
                  disabled={deleting === r.id}
                >
                  {deleting === r.id ? "Eliminando…" : "Eliminar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!confirmDelete}
        title="ELIMINAR REVIEW"
        onClose={() => setConfirmDelete(null)}
        width={420}
      >
        <p style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 24 }}>
          ¿Seguro que querés eliminar esta review? También se eliminarán todas
          sus fotos. Esta acción no se puede deshacer.
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
            onClick={() => confirmDelete && handleDelete(confirmDelete)}
            disabled={!!deleting}
          >
            {deleting ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </Modal>

      <CreateReviewModal
        open={showCreate}
        products={products}
        userId={userId}
        token={session.accessToken}
        onClose={() => setShowCreate(false)}
        onCreated={load}
      />
      <EditReviewModal
        review={editing}
        token={session.accessToken}
        onClose={() => setEditing(null)}
        onSaved={load}
      />
      <PhotosModal
        review={photosTarget}
        token={session.accessToken}
        onClose={() => setPhotosTarget(null)}
      />
    </div>
  );
}
