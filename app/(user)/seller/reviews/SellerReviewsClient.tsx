"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { getMySellerProfile } from "@/lib/seller";
import { getReviewsBySeller, getReviewPhotosByReview } from "@/lib/api";
import type { Review, ReviewPhoto } from "@/lib/types";
import { PageLoader } from "@/components/PageLoader";

function Stars({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            fontSize: 16,
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

function ReviewPhotos({ reviewId }: { reviewId: string }) {
  const [photos, setPhotos] = useState<ReviewPhoto[] | null>(null);

  useEffect(() => {
    getReviewPhotosByReview(reviewId)
      .then(setPhotos)
      .catch(() => setPhotos([]));
  }, [reviewId]);

  if (photos === null) {
    return (
      <div className="mono mute" style={{ fontSize: 11, marginTop: 12 }}>
        Cargando fotos…
      </div>
    );
  }

  if (photos.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 64px)",
        gap: 8,
        marginTop: 14,
      }}
    >
      {photos
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((ph) => (
          <a
            key={ph.id}
            href={ph.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: 64,
              height: 64,
              borderRadius: 4,
              overflow: "hidden",
              background: "var(--card)",
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
          </a>
        ))}
    </div>
  );
}

export default function SellerReviewsClient() {
  const { session, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const profile = await getMySellerProfile(session);
      if (!profile) {
        setReviews([]);
        return;
      }
      const data = await getReviewsBySeller(profile.id, session.accessToken);
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

  if (authLoading || (loading && reviews.length === 0 && !error)) {
    return <PageLoader />;
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const visibleReviews = filterRating
    ? reviews.filter((r) => r.rating === filterRating)
    : reviews;

  return (
    <div style={{ padding: "32px 32px 64px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <div
            className="mono mute"
            style={{ fontSize: 11, letterSpacing: "0.14em", marginBottom: 8 }}
          >
            ◇ PANEL DE TIENDA
          </div>
          <h1 className="display" style={{ fontSize: 40 }}>
            RESEÑAS DE MIS PRODUCTOS
          </h1>
        </div>
        {reviews.length > 0 && (
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <Stars value={Math.round(avgRating)} />
              <span className="display" style={{ fontSize: 20 }}>
                {avgRating.toFixed(1)}
              </span>
            </div>
            <div className="mono mute" style={{ fontSize: 11, marginTop: 4 }}>
              {reviews.length} review{reviews.length !== 1 ? "s" : ""} en total
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          className="mono"
          style={{ color: "var(--red, #e55)", fontSize: 12, marginBottom: 24 }}
        >
          {error}
        </div>
      )}

      {reviews.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <button
            className="btn btn-ghost"
            style={{
              fontSize: 12,
              padding: "6px 12px",
              background: filterRating === null ? "var(--card)" : "transparent",
            }}
            onClick={() => setFilterRating(null)}
          >
            Todas · {reviews.length}
          </button>
          {[5, 4, 3, 2, 1].map((n) => {
            const count = reviews.filter((r) => r.rating === n).length;
            if (count === 0) return null;
            return (
              <button
                key={n}
                className="btn btn-ghost"
                style={{
                  fontSize: 12,
                  padding: "6px 12px",
                  background:
                    filterRating === n ? "var(--card)" : "transparent",
                }}
                onClick={() => setFilterRating(n)}
              >
                {n}★ · {count}
              </button>
            );
          })}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div className="display" style={{ fontSize: 20 }}>
            Todavía no tenés reseñas en tus productos.
          </div>
          <p className="mute" style={{ marginTop: 8, fontSize: 13 }}>
            Cuando un comprador deje una reseña en alguno de tus productos,
            aparecerá aquí.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visibleReviews.map((r) => (
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
                        ✓ Compra verificada
                      </span>
                    )}
                  </div>
                  <div
                    className="mono mute"
                    style={{ fontSize: 11, marginTop: 6 }}
                  >
                    {r.userFirstName} {r.userLastName}
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
                  margin: 0,
                }}
              >
                {r.body}
              </p>

              <ReviewPhotos reviewId={r.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
