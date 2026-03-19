import { useState, useEffect } from "react";
import { useDark } from "../../context/DarkContext";
import { useAuth } from "../../context/AuthContext";
import theme from "../../theme";
import { usuariosService } from "../../services/usuarios";

const ROLE_COLORS = {
  admin:    { bg: theme.purpleBg,  color: theme.purple },
  gerente:  { bg: theme.blueBg,    color: theme.blue   },
  operador: { bg: theme.greenBg,   color: theme.green  },
};

const ROLES = ["admin", "gerente", "operador"];

const EMPTY_FORM = { nome: "", email: "", senha: "", role: "operador" };

export default function UsuariosSection() {
  const isDark   = useDark();
  const { user } = useAuth();

  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [formError,     setFormError]     = useState("");
  const [formLoading,   setFormLoading]   = useState(false);
  const [editTarget,    setEditTarget]    = useState(null); // { id, nome, email, role, senha:"" }
  const [editError,     setEditError]     = useState("");
  const [editLoading,   setEditLoading]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // id

  // ─── Carrega lista ──────────────────────────────────────────────────────────
  useEffect(() => {
    usuariosService.list()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ─── Criar usuário ──────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.email || !form.senha) {
      setFormError("Preencha todos os campos.");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      const created = await usuariosService.create(form);
      setUsers((prev) => [...prev, created]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err.message || "Erro ao criar usuário.");
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Salvar edição ──────────────────────────────────────────────────────────
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editTarget.nome || !editTarget.email) {
      setEditError("Nome e e-mail são obrigatórios.");
      return;
    }
    setEditLoading(true);
    setEditError("");
    const payload = { nome: editTarget.nome, email: editTarget.email, role: editTarget.role };
    if (editTarget.senha) payload.senha = editTarget.senha;
    try {
      const updated = await usuariosService.update(editTarget.id, payload);
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
      setEditTarget(null);
    } catch (err) {
      setEditError(err.message || "Erro ao atualizar usuário.");
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Excluir ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await usuariosService.remove(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {}
    setConfirmDelete(null);
  };

  // ─── Estilos reutilizáveis ──────────────────────────────────────────────────
  const inputSt = {
    flex: 1, minWidth: 120, padding: "8px 11px", fontSize: 13, borderRadius: 8,
    background: theme.bgInput(isDark), border: `1px solid ${theme.border(isDark)}`,
    color: theme.txtPrimary(isDark), outline: "none", boxSizing: "border-box",
  };
  const selectSt = { ...inputSt, cursor: "pointer" };
  const btnPrimary = {
    padding: "8px 18px", borderRadius: 8, border: "none",
    background: theme.accent, color: theme.accentText,
    fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
  };
  const btnGhost = {
    padding: "5px 10px", borderRadius: 6, border: `1px solid ${theme.border(isDark)}`,
    background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600,
  };

  function RoleBadge({ role }) {
    const c = ROLE_COLORS[role] || ROLE_COLORS.operador;
    return (
      <span style={{
        display: "inline-block", padding: "2px 8px", borderRadius: 5,
        fontSize: 11, fontWeight: 700, textTransform: "capitalize",
        background: c.bg(isDark), color: c.color,
      }}>
        {role}
      </span>
    );
  }

  return (
    <div style={{ padding: 20, background: theme.bgCard(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 12 }}>
      {/* Título */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: theme.txtMuted(isDark), marginBottom: 16 }}>
        Gerenciar Usuários
      </div>

      {/* ── Tabela de usuários ── */}
      {loading ? (
        <div style={{ fontSize: 13, color: theme.txtMuted(isDark), padding: "12px 0" }}>Carregando...</div>
      ) : users.length === 0 ? (
        <div style={{ fontSize: 13, color: theme.txtMuted(isDark), padding: "12px 0" }}>Nenhum usuário cadastrado.</div>
      ) : (
        <div style={{ overflowX: "auto", marginBottom: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Nome", "E-mail", "Função", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontSize: 11, fontWeight: 700, color: theme.txtMuted(isDark), borderBottom: `1px solid ${theme.border(isDark)}`, whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${theme.border(isDark)}` }}>
                  <td style={{ padding: "9px 10px", color: theme.txtPrimary(isDark), fontWeight: 600 }}>
                    {u.nome}
                    {u.id === user?.id && <span style={{ marginLeft: 6, fontSize: 10, color: theme.txtMuted(isDark) }}>(você)</span>}
                  </td>
                  <td style={{ padding: "9px 10px", color: theme.txtSecondary(isDark) }}>{u.email}</td>
                  <td style={{ padding: "9px 10px" }}><RoleBadge role={u.role} /></td>
                  <td style={{ padding: "9px 10px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => { setEditTarget({ ...u, senha: "" }); setEditError(""); }}
                        style={{ ...btnGhost, color: theme.blue }}
                      >✏ Editar</button>
                      {u.id !== user?.id && (
                        <button
                          onClick={() => setConfirmDelete(u.id)}
                          style={{ ...btnGhost, color: theme.red }}
                        >🗑 Excluir</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal de confirmação de exclusão ── */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)" }}>
          <div style={{ background: theme.bgCard(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 12, padding: 28, maxWidth: 340, width: "90%", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.txtPrimary(isDark), marginBottom: 10 }}>Confirmar exclusão</div>
            <div style={{ fontSize: 13, color: theme.txtSecondary(isDark), marginBottom: 20 }}>
              Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setConfirmDelete(null)} style={{ ...btnGhost, color: theme.txtSecondary(isDark) }}>Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ ...btnPrimary, background: theme.red, color: "#fff" }}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de edição ── */}
      {editTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)" }}>
          <div style={{ background: theme.bgCard(isDark), border: `1px solid ${theme.border(isDark)}`, borderRadius: 12, padding: 28, maxWidth: 420, width: "90%" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.txtPrimary(isDark), marginBottom: 18 }}>Editar Usuário</div>
            <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: theme.txtMuted(isDark), display: "block", marginBottom: 4 }}>Nome</label>
                <input value={editTarget.nome} onChange={(e) => setEditTarget((p) => ({ ...p, nome: e.target.value }))} style={{ ...inputSt, width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: theme.txtMuted(isDark), display: "block", marginBottom: 4 }}>E-mail</label>
                <input type="email" value={editTarget.email} onChange={(e) => setEditTarget((p) => ({ ...p, email: e.target.value }))} style={{ ...inputSt, width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: theme.txtMuted(isDark), display: "block", marginBottom: 4 }}>Nova senha <span style={{ color: theme.txtMuted(isDark), fontStyle: "italic" }}>(deixe vazio para não alterar)</span></label>
                <input type="password" value={editTarget.senha} onChange={(e) => setEditTarget((p) => ({ ...p, senha: e.target.value }))} placeholder="••••••••" style={{ ...inputSt, width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: theme.txtMuted(isDark), display: "block", marginBottom: 4 }}>Função</label>
                <select value={editTarget.role} onChange={(e) => setEditTarget((p) => ({ ...p, role: e.target.value }))} style={{ ...selectSt, width: "100%" }}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {editError && <div style={{ fontSize: 12, color: theme.red, fontWeight: 600 }}>{editError}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button type="button" onClick={() => setEditTarget(null)} style={{ ...btnGhost, color: theme.txtSecondary(isDark) }}>Cancelar</button>
                <button type="submit" disabled={editLoading} style={{ ...btnPrimary, opacity: editLoading ? 0.7 : 1 }}>
                  {editLoading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Formulário de criação ── */}
      <div style={{ borderTop: `1px solid ${theme.border(isDark)}`, paddingTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: theme.txtSecondary(isDark), marginBottom: 12 }}>+ Novo Usuário</div>
        <form onSubmit={handleCreate}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
            <input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome completo" style={inputSt} />
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@empresa.com" style={inputSt} />
            <input type="password" value={form.senha} onChange={(e) => setForm((p) => ({ ...p, senha: e.target.value }))} placeholder="Senha (mín. 8 caracteres)" style={inputSt} />
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} style={{ ...selectSt, flex: "0 0 130px" }}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {formError && <div style={{ fontSize: 12, color: theme.red, fontWeight: 600, marginBottom: 8 }}>{formError}</div>}
          <button type="submit" disabled={formLoading} style={{ ...btnPrimary, opacity: formLoading ? 0.7 : 1 }}>
            {formLoading ? "Criando..." : "Criar Usuário"}
          </button>
        </form>
      </div>
    </div>
  );
}
