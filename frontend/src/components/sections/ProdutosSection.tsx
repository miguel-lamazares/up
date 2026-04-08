import { useState, useEffect } from "react";
import { Pencil, Trash2, X, AlertCircle } from "lucide-react";
import { listarInsumos, adicionarProduto, deletarInsumo, atualizarInsumo, Insumo } from "@/services/api";

interface InsumoConsumo {
  insumo_id: number;
  quantidade: string;
}

const ProdutosSection = () => {
  const [produtos, setProdutos] = useState<Insumo[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [produtoNome, setProdutoNome] = useState("");
  const [lote, setLote] = useState("");
  const [validade, setValidade] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [insumosUsados, setInsumosUsados] = useState<InsumoConsumo[]>([]);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQtd, setEditQtd] = useState("");

  const fetchData = () => {
    setLoading(true);
    listarInsumos()
      .then((all) => {
        // Produtos acabados = unidade "un", Insumos = outros
        const prods = all.filter((i) => i.unidade === "un");
        const ins = all.filter((i) => i.unidade !== "un");
        setProdutos(prods);
        setInsumos(ins);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const addInsumoConsumo = () => {
    if (insumos.length === 0) return;
    setInsumosUsados([...insumosUsados, { insumo_id: insumos[0].id, quantidade: "" }]);
  };

  const removeInsumoConsumo = (index: number) => {
    setInsumosUsados(insumosUsados.filter((_, i) => i !== index));
  };

  const updateInsumoConsumo = (index: number, field: keyof InsumoConsumo, value: string | number) => {
    const updated = [...insumosUsados];
    updated[index] = { ...updated[index], [field]: value };
    setInsumosUsados(updated);
  };

  const handleRegistrar = async () => {
    if (!produtoNome || !lote || !validade || !quantidade) {
      alert("Preencha todos os campos do produto.");
      return;
    }
    const consumidos = insumosUsados
      .filter((i) => i.quantidade)
      .map((i) => ({ insumo_id: i.insumo_id, quantidade: Number(i.quantidade) }));

    try {
      await adicionarProduto(produtoNome, Number(quantidade), lote, validade, consumidos);
      setProdutoNome(""); setLote(""); setValidade(""); setQuantidade("");
      setInsumosUsados([]);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este produto?")) return;
    try { await deletarInsumo(id); fetchData(); } catch (e: any) { alert(e.message); }
  };

  const handleEdit = async (id: number) => {
    if (!editQtd) return;
    try {
      await atualizarInsumo(id, Number(editQtd));
      setEditingId(null); setEditQtd("");
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="space-y-8"><h1>Produtos Acabados</h1><p className="text-muted-foreground">Carregando...</p></div>;
  if (error) return <div className="space-y-8"><h1>Produtos Acabados</h1><div className="card-glass p-6 flex items-center gap-3 text-destructive"><AlertCircle size={20} /><p>{error}</p></div></div>;

  return (
    <div className="space-y-8">
      <h1>Produtos Acabados</h1>

      {/* Registration form */}
      <div className="card-glass p-6 space-y-4">
        <h3 className="text-foreground text-base font-semibold">Registrar Novo Produto</h3>

        <input
          value={produtoNome}
          onChange={(e) => setProdutoNome(e.target.value)}
          placeholder="Nome do produto"
          className="w-full px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="Quantidade" type="number" className="px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm" />
          <input value={lote} onChange={(e) => setLote(e.target.value)} placeholder="Lote" className="px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm" />
          <input value={validade} onChange={(e) => setValidade(e.target.value)} placeholder="Validade (DD/MM/AAAA)" className="px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm" />
        </div>

        {/* Insumos consumidos */}
        <div className="space-y-2">
          <h3 className="text-muted-foreground">Insumos consumidos na produção:</h3>
          {insumosUsados.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                value={item.insumo_id}
                onChange={(e) => updateInsumoConsumo(i, "insumo_id", Number(e.target.value))}
                className="flex-1 px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm"
              >
                {insumos.map((ins) => (
                  <option key={ins.id} value={ins.id}>{ins.nome} ({ins.unidade})</option>
                ))}
              </select>
              <input
                value={item.quantidade}
                onChange={(e) => updateInsumoConsumo(i, "quantidade", e.target.value)}
                placeholder="Qtd"
                type="number"
                className="w-24 px-3 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm"
              />
              <button onClick={() => removeInsumoConsumo(i)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition text-xs">
                ✕
              </button>
            </div>
          ))}
          <button onClick={addInsumoConsumo} className="text-sm text-primary hover:underline">
            + Adicionar insumo
          </button>
        </div>

        <button onClick={handleRegistrar} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition">
          Registrar
        </button>
      </div>

      {/* Product cards */}
      {produtos.length === 0 ? (
        <div className="card-glass p-10 text-center">
          <p className="text-muted-foreground">Nenhum produto cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {produtos.map((produto) => (
            <div key={produto.id} className="card-glass p-6 space-y-3 relative">
              <h3 className="text-foreground text-base font-semibold">{produto.nome}</h3>
              <p className="text-2xl font-bold text-primary">{produto.quantidade} {produto.unidade}</p>

              {produto.lotes && produto.lotes.length > 0 ? (
                produto.lotes.map((lote, i) => (
                  <div key={i} className="text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
                    Lote {lote.lote} — {lote.validade ? `Vence em ${lote.validade}` : "Sem validade"}
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">Sem lotes cadastrados</p>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={() => { setEditingId(produto.id); setEditQtd(""); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition">
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={() => handleDelete(produto.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition">
                  <Trash2 size={14} /> Remover
                </button>
              </div>

              {editingId === produto.id && (
                <div className="absolute inset-0 bg-card/95 backdrop-blur rounded-xl p-6 flex flex-col gap-4 z-10">
                  <div className="flex justify-between items-center">
                    <h3 className="text-foreground text-base font-semibold">Editar {produto.nome}</h3>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground transition">
                      <X size={18} />
                    </button>
                  </div>
                  <input value={editQtd} onChange={(e) => setEditQtd(e.target.value)} placeholder="Ajuste de quantidade (+/-)" type="number" className="px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm" />
                  <button onClick={() => handleEdit(produto.id)} className="py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition">
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

export default ProdutosSection;
