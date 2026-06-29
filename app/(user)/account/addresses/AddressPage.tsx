"use client";

import { useEffect, useState } from "react";
import { useAuth, authFetch, getUserId } from "@/lib/auth";
import { useToast } from "@/hooks/useToast";

type Address = {
  id: string;
  alias?: string | null;
  street: string;
  city: string;
  state?: string | null;
  country?: string;
  postalCode?: string | null;
  zip?: string;
  default?: boolean;
};

export default function AddressPage() {
  const { session } = useAuth();
  const { show, ToastContainer } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    alias: "",
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    default: false,
  });

  useEffect(() => {
    if (!session) return;

    const load = async () => {
      try {
        setLoading(true);
        const userId = getUserId(session);
        if (!userId) throw new Error("No se pudo obtener el userId");

        const res = await authFetch(`/addresses/user/${userId}`, session);
        const json = await res.json();

        if (!res.ok) throw new Error(json?.message || "Error cargando direcciones");

        setAddresses(json.data ?? []);
      } catch (err: any) {
        setError(err.message ?? "Error inesperado");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session]);

  if (!session) return null;

  const validateCreate = () => {
    const e: Record<string, string> = {};
    if (!form.street.trim()) e.street = "La calle es requerida";
    if (form.street.length > 150) e.street = "Máx 150 caracteres";
    if (!form.city.trim()) e.city = "La ciudad es requerida";
    if (!form.country.trim()) e.country = "El país es requerido";
    if (form.alias.length > 100) e.alias = "Alias máximo 100 caracteres";
    if (form.postalCode.length > 20) e.postalCode = "Código postal máximo 20 caracteres";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateEdit = () => {
    const e: Record<string, string> = {};
    if (!selectedAddress.street?.trim()) e.street = "La calle es requerida";
    if (selectedAddress.street?.length > 150) e.street = "Máx 150 caracteres";
    if (!selectedAddress.city?.trim()) e.city = "La ciudad es requerida";
    if (!selectedAddress.country?.trim()) e.country = "El país es requerido";
    if (selectedAddress.alias?.length > 100) e.alias = "Alias máximo 100 caracteres";
    if (selectedAddress.postalCode?.length > 20) e.postalCode = "Código postal máximo 20 caracteres";

    setEditErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    const userId = getUserId(session);
    if (!userId) return;

    if (!validateCreate()) return;

    // Validación para evitar múltiples direcciones default
    if (form.default && addresses.some((addr) => addr.default)) {
      show("Ya tienes una dirección marcada como principal", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await authFetch("/addresses/create", session, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias: form.alias || null,
          street: form.street,
          city: form.city,
          state: form.state || null,
          country: form.country,
          postalCode: form.postalCode || null,
          isDefault: form.default,
        }),
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : null;

      if (!res.ok) throw new Error(json?.message || "Error creando dirección");

      show("Dirección guardada con éxito", "success");

      const newAddress = json.data;
      setAddresses((prev) => {
        if (newAddress.default) {
          return prev.map((addr) => ({ ...addr, default: false })).concat(newAddress);
        }
        return [...prev, newAddress];
      });

      setOpen(false);
      setForm({
        alias: "",
        street: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
        default: false,
      });
    } catch (err: any) {
      show(err.message || "Error inesperado al guardar", "error");
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (id: string, mode: "view" | "edit") => {
    setSelectedId(id);
    setModalMode(mode);
    setModalOpen(true);
    setEditErrors({});

    try {
      const res = await authFetch(`/addresses/${id}`, session);
      const json = await res.json();
      setSelectedAddress(json?.data ?? json);
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;

    try {
      setLoading(true);
      const res = await authFetch(`/addresses/${addressToDelete}`, session, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "No se pudo eliminar la dirección");
      }

      show("Dirección eliminada correctamente", "success");
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressToDelete));
      setDeleteModalOpen(false);
    } catch (err: any) {
      show(err.message || "Error al eliminar la dirección", "error");
    } finally {
      setLoading(false);
      setAddressToDelete(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ToastContainer />

      <div className="card" style={{ padding: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            borderBottom: "1px solid var(--border)",
            paddingBottom: 16,
            marginBottom: 16,
          }}
        >
          <h2 className="display" style={{ fontSize: 18 }}>
            DIRECCIONES
          </h2>
          <button className="btn" onClick={() => setOpen(true)}>
            + Nueva dirección
          </button>
        </div>
        <p className="mute" style={{ fontSize: 13 }}>
          Administra tus direcciones de envío registradas en tu cuenta.
        </p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        {loading && <p className="mute">Procesando...</p>}
        {!loading && error && <p style={{ color: "#e05252", fontSize: 12 }}>{error}</p>}
        {!loading && !error && addresses.length === 0 && (
          <p className="mute">No tienes direcciones registradas.</p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          {addresses.map((addr, i) => (
            <div
              key={addr.id ?? `${addr.street}-${addr.city}-${i}`}
              style={{
                border: "1px solid var(--border)",
                padding: 20,
                background: "var(--card)",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="mono mute" style={{ fontSize: 11 }}>
                  {addr.alias || "DIRECCIÓN"}
                </div>
                
                {addr.default && (
                  <div className="prod-badges">
                    <span className="badge verified">✓ VERIFICADO</span>
                  </div>
                )}
              </div>

              <div style={{ fontSize: 14, marginTop: 10 }}>{addr.street}</div>
              <div className="mute" style={{ fontSize: 12, marginTop: 4 }}>
                {[addr.city, addr.state, addr.country].filter(Boolean).join(", ")}
              </div>

              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  display: "flex",
                  gap: 8,
                }}
              >
                <button
                  onClick={() => openModal(addr.id, "view")}
                  title="Ver detalles"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--mute)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--border)";
                    e.currentTarget.style.color = "var(--text)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--mute)";
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>

                <button
                  onClick={() => openModal(addr.id, "edit")}
                  title="Editar dirección"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--mute)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--border)";
                    e.currentTarget.style.color = "var(--text)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--mute)";
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>

                <button
                  onClick={() => {
                    setAddressToDelete(addr.id);
                    setDeleteModalOpen(true);
                  }}
                  title="Eliminar dirección"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--mute)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#e05252";
                    e.currentTarget.style.background = "rgba(224, 82, 82, 0.1)";
                    e.currentTarget.style.color = "#e05252";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--mute)";
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= MODAL CREAR ================= */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 92vw)",
              background: "var(--bg-1)",
              border: "1px solid var(--border)",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 className="display">Nueva Dirección</h3>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Alias de la dirección</label>
                <input
                  value={form.alias}
                  onChange={(e) => setForm({ ...form, alias: e.target.value })}
                  className="input"
                  placeholder="Ej. Casa, Oficina, Depto..."
                  style={{ width: "100%" }}
                />
                {errors.alias && <div style={{ color: "#e05252", fontSize: 11, marginTop: 4 }}>{errors.alias}</div>}
              </div>

              <div>
                <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  Calle y número <span style={{ color: "#e05252" }}>*</span>
                </label>
                <input
                  required
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  className="input"
                  placeholder="Ej. Av. Los Próceres 123"
                  style={{ width: "100%" }}
                />
                {errors.street && <div style={{ color: "#e05252", fontSize: 11, marginTop: 4 }}>{errors.street}</div>}
              </div>

              <div>
                <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  Ciudad <span style={{ color: "#e05252" }}>*</span>
                </label>
                <input
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="input"
                  placeholder="Ej. San Salvador"
                  style={{ width: "100%" }}
                />
                {errors.city && <div style={{ color: "#e05252", fontSize: 11, marginTop: 4 }}>{errors.city}</div>}
              </div>

              <div>
                <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Estado / Departamento</label>
                <input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="input"
                  placeholder="Ej. San Salvador"
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  País <span style={{ color: "#e05252" }}>*</span>
                </label>
                <input
                  required
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="input"
                  placeholder="Ej. El Salvador"
                  style={{ width: "100%" }}
                />
                {errors.country && <div style={{ color: "#e05252", fontSize: 11, marginTop: 4 }}>{errors.country}</div>}
              </div>

              <div>
                <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Código Postal</label>
                <input
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  className="input"
                  placeholder="Ej. 1101"
                  style={{ width: "100%" }}
                />
                {errors.postalCode && <div style={{ color: "#e05252", fontSize: 11, marginTop: 4 }}>{errors.postalCode}</div>}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <input
                  type="checkbox"
                  checked={form.default}
                  onChange={(e) => setForm({ ...form, default: e.target.checked })}
                />
                <label style={{ fontSize: 12 }}>Establecer como dirección principal</label>
              </div>

              <button className="btn" onClick={handleSubmit} style={{ marginTop: 16 }}>
                Guardar dirección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETALLES / EDICIÓN ================= */}
      {modalOpen && selectedAddress && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 92vw)",
              background: "var(--bg-1)",
              border: "1px solid var(--border)",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 className="display">
                {modalMode === "view" ? "Detalles de Dirección" : "Editar dirección"}
              </h3>
              <button onClick={() => setModalOpen(false)}>✕</button>
            </div>

            {modalMode === "view" && (
              <div style={{ marginTop: 16 }}>
                <p><strong>Alias:</strong> {selectedAddress.alias || "Sin alias"}</p>
                <p><strong>Calle:</strong> {selectedAddress.street}</p>
                <p><strong>Ciudad:</strong> {selectedAddress.city}</p>
                <p><strong>Estado/Depto:</strong> {selectedAddress.state || "N/A"}</p>
                <p><strong>País:</strong> {selectedAddress.country}</p>
                <p><strong>CP:</strong> {selectedAddress.postalCode || selectedAddress.zip || "N/A"}</p>
              </div>
            )}

            {modalMode === "edit" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Alias de la dirección</label>
                  <input
                    value={selectedAddress.alias || ""}
                    onChange={(e) => setSelectedAddress({ ...selectedAddress, alias: e.target.value })}
                    className="input"
                    placeholder="Ej. Casa, Oficina..."
                    style={{ width: "100%" }}
                  />
                  {editErrors.alias && <div style={{ color: "#e05252", fontSize: 11, marginTop: 4 }}>{editErrors.alias}</div>}
                </div>

                <div>
                  <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                    Calle y número <span style={{ color: "#e05252" }}>*</span>
                  </label>
                  <input
                    required
                    value={selectedAddress.street || ""}
                    onChange={(e) => setSelectedAddress({ ...selectedAddress, street: e.target.value })}
                    className="input"
                    placeholder="Ej. Av. Los Próceres 123"
                    style={{ width: "100%" }}
                  />
                  {editErrors.street && <div style={{ color: "#e05252", fontSize: 11, marginTop: 4 }}>{editErrors.street}</div>}
                </div>

                <div>
                  <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                    Ciudad <span style={{ color: "#e05252" }}>*</span>
                  </label>
                  <input
                    required
                    value={selectedAddress.city || ""}
                    onChange={(e) => setSelectedAddress({ ...selectedAddress, city: e.target.value })}
                    className="input"
                    placeholder="Ej. San Salvador"
                    style={{ width: "100%" }}
                  />
                  {editErrors.city && <div style={{ color: "#e05252", fontSize: 11, marginTop: 4 }}>{editErrors.city}</div>}
                </div>

                <div>
                  <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Estado / Departamento</label>
                  <input
                    value={selectedAddress.state || ""}
                    onChange={(e) => setSelectedAddress({ ...selectedAddress, state: e.target.value })}
                    className="input"
                    placeholder="Ej. San Salvador"
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                    País <span style={{ color: "#e05252" }}>*</span>
                  </label>
                  <input
                    required
                    value={selectedAddress.country || ""}
                    onChange={(e) => setSelectedAddress({ ...selectedAddress, country: e.target.value })}
                    className="input"
                    placeholder="Ej. El Salvador"
                    style={{ width: "100%" }}
                  />
                  {editErrors.country && <div style={{ color: "#e05252", fontSize: 11, marginTop: 4 }}>{editErrors.country}</div>}
                </div>

                <div>
                  <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Código Postal</label>
                  <input
                    value={selectedAddress.postalCode || selectedAddress.zip || ""}
                    onChange={(e) => setSelectedAddress({ ...selectedAddress, postalCode: e.target.value })}
                    className="input"
                    placeholder="Ej. 1101"
                    style={{ width: "100%" }}
                  />
                  {editErrors.postalCode && <div style={{ color: "#e05252", fontSize: 11, marginTop: 4 }}>{editErrors.postalCode}</div>}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    checked={selectedAddress.default || false}
                    onChange={(e) => setSelectedAddress({ ...selectedAddress, default: e.target.checked })}
                  />
                  <label style={{ fontSize: 12 }}>Establecer como dirección principal</label>
                </div>

                <button
                  className="btn"
                  style={{ marginTop: 16 }}
                  onClick={async () => {
                    if (!validateEdit()) return;

                    // Validación opcional en edición por si intentan activar default y ya existe otro diferente
                    if (selectedAddress.default && addresses.some((addr) => addr.default && addr.id !== selectedId)) {
                      show("Ya tienes otra dirección marcada como principal", "error");
                      return;
                    }

                    try {
                      const res = await authFetch(`/addresses/update/${selectedId}`, session, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          street: selectedAddress.street,
                          city: selectedAddress.city,
                          state: selectedAddress.state || null,
                          country: selectedAddress.country,
                          postalCode: selectedAddress.postalCode || selectedAddress.zip || null,
                          alias: selectedAddress.alias || null,
                          isDefault: selectedAddress.default || false,
                        }),
                      });

                      if (!res.ok) {
                        const errJson = await res.json().catch(() => ({}));
                        throw new Error(errJson?.message || "Error al actualizar la dirección");
                      }

                      setAddresses((prev) => {
                        const updated = prev.map((addr) =>
                          addr.id === selectedId ? { ...addr, ...selectedAddress } : addr
                        );
                        if (selectedAddress.default) {
                          return updated.map((addr) =>
                            addr.id === selectedId ? addr : { ...addr, default: false }
                          );
                        }
                        return updated;
                      });

                      show("Cambios guardados correctamente", "success");
                      setModalOpen(false);
                    } catch (err: any) {
                      show(err.message || "Hubo un problema al guardar los cambios", "error");
                    }
                  }}
                >
                  Guardar Cambios
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ================= */}
      {deleteModalOpen && (
        <div
          onClick={() => {
            setDeleteModalOpen(false);
            setAddressToDelete(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(400px, 92vw)",
              background: "var(--bg-1)",
              border: "1px solid var(--border)",
              padding: 24,
              textAlign: "center",
            }}
          >
            <h3 className="display" style={{ fontSize: 16, marginBottom: 12, color: "#e05252" }}>
              ¿ELIMINAR DIRECCIÓN?
            </h3>
            <p className="mute" style={{ fontSize: 13, marginBottom: 24 }}>
              Esta acción no se puede deshacer. ¿Estás seguro de que quieres quitar esta dirección de tu cuenta?
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button
                className="btn"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
                onClick={() => {
                  setDeleteModalOpen(false);
                  setAddressToDelete(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="btn"
                style={{
                  background: "#e05252",
                  color: "#fff",
                  border: "1px solid #e05252",
                }}
                onClick={confirmDelete}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}