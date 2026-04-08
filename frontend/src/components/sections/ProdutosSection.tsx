import { useState } from "react";

const produtosMock = [
  { id: 1, nome: "Coco 200ml", quantidade: 150, unidade: "un", lotes: [{ lote: "L001", validade: "15/06/2026" }] },
  { id: 2, nome: "Polpa A", quantidade: 80, unidade: "kg", lotes: [{ lote: "L002", validade: "20/05/2026" }] },
  { id: 3, nome: "Coco 1L", quantidade: 200, unidade: "un", lotes: [] },
];

const produtoOpcoes = ["Coco 200ml", "Coco 500ml", "Coco 1L", "Polpa A", "Polpa B", "Polpa C"];

// Mock insumos for consumption when registering a product
const insumosDisponiveis = [
  { id: 1, nome: "Garrafa 200ml", unidade: "un" },
  { id: 2, nome: "Rótulo 200ml", unidade: "un" },
  { id: 3, nome: "Tampa", unidade: "un" },
  { id: 4, nome: "Garrafa 500ml", unidade: "un" },
  { id: 5, nome: "Garrafa 1L", unidade: "un" },
  { id: 6, nome: "Açúcar", unidade: "kg" },
  { id: 7, nome: "Essência de Coco", unidade: "L" },
];

interface InsumoConsumo {
  insumo_id: number;
  quantidade: string;
}

const ProdutosSection = () => {
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [lote, setLote] = useState("");
  const [validade, setValidade] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [insumosUsados, setInsumosUsados] = useState<InsumoConsumo[]>([]);

  const addInsumoConsumo = () => {
    setInsumosUsados([...insumosUsados, { insumo_id: insumosDisponiveis[0].id, quantidade: "" }]);
  };

  const removeInsumoConsumo = (index: number) => {
    setInsumosUsados(insumosUsados.filter((_, i) => i !== index));
  };

  const updateInsumoConsumo = (index: number, field: keyof InsumoConsumo, value: string | number) => {
    const updated = [...insumosUsados];
    updated[index] = { ...updated[index], [field]: value };
    setInsumosUsados(updated);
  };

  const handleRegistrar = () => {
    if (!produtoSelecionado || !lote || !validade || !quantidade) {
      alert("Preencha todos os campos do produto.");
      return;
    }
    // Here you'd call the API: adicionarProduto(produtoSelecionado, Number(quantidade), lote, validade, insumosUsados)
    alert(`Produto "${produtoSelecionado}" registrado com ${insumosUsados.length} insumos consumidos.`);
    setProdutoSelecionado("");
    setLote("");
    setValidade("");
    setQuantidade("");
    setInsumosUsados([]);
  };

  return (
    <div className="space-y-8">
      <h1>Produtos Acabados</h1>

      {/* Registration form */}
      <div className="card-glass p-6 space-y-4">
        <h3 className="text-foreground text-base font-semibold">Registrar Novo Produto</h3>

        <select
          value={produtoSelecionado}
          onChange={(e) => setProdutoSelecionado(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm"
        >
          <option value="">Selecione</option>
          {produtoOpcoes.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="Quantidade"
            type="number"
            className="px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm"
          />
          <input
            value={lote}
            onChange={(e) => setLote(e.target.value)}
            placeholder="Lote"
            className="px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm"
          />
          <input
            value={validade}
            onChange={(e) => setValidade(e.target.value)}
            placeholder="Validade (DD/MM/AAAA)"
            className="px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm"
          />
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
                {insumosDisponiveis.map((ins) => (
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
              <button
                onClick={() => removeInsumoConsumo(i)}
                className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition text-xs"
              >
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {produtosMock.map((produto) => (
          <div key={produto.id} className="card-glass p-6 space-y-3">
            <h3 className="text-foreground text-base font-semibold">{produto.nome}</h3>
            <p className="text-2xl font-bold text-primary">{produto.quantidade} {produto.unidade}</p>

            {produto.lotes.length > 0 ? (
              produto.lotes.map((lote, i) => (
                <div key={i} className="text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
                  Lote {lote.lote} — Vence em {lote.validade}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">Sem lotes cadastrados</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProdutosSection;
