const produtosMock = [
  { id: 1, nome: "Coco 200ml", quantidade: 150, unidade: "un", lotes: [{ lote: "L001", validade: "15/06/2026" }] },
  { id: 2, nome: "Polpa A", quantidade: 80, unidade: "kg", lotes: [{ lote: "L002", validade: "20/05/2026" }] },
  { id: 3, nome: "Coco 1L", quantidade: 200, unidade: "un", lotes: [] },
];

const produtoOpcoes = ["Coco 200ml", "Coco 500ml", "Coco 1L", "Polpa A", "Polpa B", "Polpa C"];

const ProdutosSection = () => (
  <div className="animate-fade-in space-y-6">
    <h1 className="text-foreground">Produtos Acabados</h1>

    <div className="card-glass p-6">
      <form method="post" action="/produtos/add" className="flex flex-wrap gap-3 items-end">
        <select
          name="produto_nome"
          required
          className="flex-1 min-w-[160px] px-4 py-2.5 rounded-lg bg-input border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        >
          <option value="">Selecione</option>
          {produtoOpcoes.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input type="number" name="quantidade" min="1" required placeholder="Qtd" className="w-24 px-4 py-2.5 rounded-lg bg-input border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
        <input type="text" name="lote" placeholder="Lote" required className="w-28 px-4 py-2.5 rounded-lg bg-input border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
        <input type="date" name="validade" required className="px-4 py-2.5 rounded-lg bg-input border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
        <button type="submit" className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
          Registrar
        </button>
      </form>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {produtosMock.map((produto) => (
        <div key={produto.id} className="card-glass p-5 space-y-3">
          <h3 className="text-primary font-semibold text-base">{produto.nome}</h3>
          <p className="text-lg font-bold text-foreground">{produto.quantidade} {produto.unidade}</p>
          {produto.lotes.length > 0 ? (
            produto.lotes.map((lote, i) => (
              <div key={i} className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
                <span className="font-medium">Lote {lote.lote}</span> — Vence em {lote.validade}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">Sem lotes cadastrados</p>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default ProdutosSection;
