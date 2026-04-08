import { useState, useEffect } from "react";
import { Pencil, Trash2, X, AlertCircle } from "lucide-react";
import { listarInsumos, criarInsumo, deletarInsumo, atualizarInsumo, adicionarLote, Insumo } from "@/services/api";

const EstoqueSection = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQtd, setEditQtd] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [newQtd, setNewQtd] = useState("");
  const [newUnidade, setNewUnidade] = useState("un");
  const [newLote, setNewLote] = useState("");
  const [newValidade, setNewValidade] = useState("");

  const fetchInsumos = () => {
    setLoading(true);
    listarInsumos()
      .then(setInsumos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInsumos(); }, []);

  const handleAdd = async () => {
    if (!newNome || !newQtd) return;
    try {
      await adicionarLote(null, Number(newQtd), newLote || undefined, newValidade || undefined, newNome, newUnidade);
      setNewNome(""); setNewQtd(""); setNewUnidade("un"); setNewLote(""); setNewValidade("");
      setShowAdd(false);
      fetchInsumos();
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este insumo?")) return;
    try { await deletarInsumo(id); fetchInsumos(); } catch (e: any) { alert(e.message); }
  };

  const handleEdit = async (id: number) => {
    if (!editQtd) return;
    try {
      await atualizarInsumo(id, Number(editQtd));
      setEditingId(null); setEditQtd("");
      fetchInsumos();
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="space-y-8"><h1>Estoque de Insumos</h1><p className="text-muted-foreground">Carregando...</p></div>;
  if (error) return <div className="space-y-8"><h1>Estoque de Insumos</h1><div className="card-glass p-6 flex items-center gap-3 text-destructive"><AlertCircle size={20} /><p>{error}</p></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1>Estoque de Insumos</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
          Adicionar
        </button>
      </div>

      {showAdd && (
        <div className="card-glass p-6 space-y-4">
          <h3 className="text-foreground text-base font-semibold">Novo Insumo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={newNome} onChange={(e) => setNewNome(e.target.value)} placeholder="Nome" className="px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm" />
            <input value={newQtd} onChange={(e) => setNewQtd(e.target.value)} placeholder="Quantidade" type="number" className="px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm" />
            <select value={newUnidade} onChange={(e) => setNewUnidade(e.target.value)} className="px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm">
              <option value="un">un</option>
              <option value="kg">kg</option>
              <option value="L">L</option>
              <option value="ml">ml</option>
              <option value="g">g</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={newLote} onChange={(e) => setNewLote(e.target.value)} placeholder="Lote (opcional)" className="px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm" />
            <input value={newValidade} onChange={(e) => setNewValidade(e.target.value)} placeholder="Validade (opcional)" className="px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm" />
          </div>
          <button onClick={handleAdd} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition">Salvar</button>
        </div>
      )}

      {insumos.length === 0 ? (
        <div className="card-glass p-10 text-center space-y-4">
          <p className="text-muted-foreground">Nenhum insumo cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insumos.map((insumo) => (
            <div key={insumo.id} className="card-glass p-6 space-y-3 relative">
              <h3 className="text-foreground text-base font-semibold">{insumo.nome}</h3>
              <p className="text-2xl font-bold text-primary">{insumo.quantidade} {insumo.unidade}</p>

              {insumo.lotes && insumo.lotes.length > 0 ? (
                insumo.lotes.map((lote, i) => (
                  <div key={i} className="text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
                    Lote {lote.lote} — {lote.validade ? `Vence em ${lote.validade}` : "Não perecível"}
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">Sem lotes cadastrados</p>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={() => { setEditingId(insumo.id); setEditQtd(""); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition">
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={() => handleDelete(insumo.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition">
                  <Trash2 size={14} /> Remover
                </button>
              </div>

              {editingId === insumo.id && (
                <div className="absolute inset-0 bg-card/95 backdrop-blur rounded-xl p-6 flex flex-col gap-4 z-10">
                  <div className="flex justify-between items-center">
                    <h3 className="text-foreground text-base font-semibold">Editar {insumo.nome}</h3>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground transition">
                      <X size={18} />
                    </button>
                  </div>
                  <input value={editQtd} onChange={(e) => setEditQtd(e.target.value)} placeholder="Ajuste de quantidade (+/-)" type="number" className="px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm" />
                  <button onClick={() => handleEdit(insumo.id)} className="py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition">
                    Salvar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EstoqueSection;
