import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";

const insumosMock = [
  { id: 1, nome: "Açúcar", quantidade: 50, unidade: "kg", lotes: [{ lote: "A01", validade: "10/08/2026" }] },
  { id: 2, nome: "Essência de Coco", quantidade: 12, unidade: "L", lotes: [{ lote: "E01", validade: null }] },
  { id: 3, nome: "Embalagem 200ml", quantidade: 500, unidade: "un", lotes: [] },
];

const EstoqueSection = () => {
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-foreground">Estoque de Insumos</h1>

      <div className="card-glass p-6">
        <form method="post" action="/insumos/lote/add" className="flex flex-wrap gap-3 items-end">
          <input type="text" name="nome" placeholder="Nome" required className="flex-1 min-w-[140px] px-4 py-2.5 rounded-lg bg-input border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
          <input type="number" step="0.01" name="quantidade" placeholder="Quantidade" required className="w-28 px-4 py-2.5 rounded-lg bg-input border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
          <input type="text" name="unidade" placeholder="Unidade" required className="w-24 px-4 py-2.5 rounded-lg bg-input border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
          <input type="text" name="lote" placeholder="Lote (opcional)" className="w-32 px-4 py-2.5 rounded-lg bg-input border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
          <input type="date" name="validade" className="px-4 py-2.5 rounded-lg bg-input border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
          <button type="submit" className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
            Adicionar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insumosMock.map((insumo) => (
          <div key={insumo.id} className="card-glass p-5 space-y-3 relative">
            <h3 className="text-primary font-semibold text-base">{insumo.nome}</h3>
            <p className="text-lg font-bold text-foreground">{insumo.quantidade} {insumo.unidade}</p>

            {insumo.lotes.length > 0 ? (
              insumo.lotes.map((lote, i) => (
                <div key={i} className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
                  <span className="font-medium">Lote {lote.lote}</span> — {lote.validade ? `Vence em ${lote.validade}` : "Não perecível"}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Sem lotes cadastrados</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingId(insumo.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition"
              >
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
              <form method="post" action="/insumos/delete">
                <input type="hidden" name="id" value={insumo.id} />
                <button type="submit" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition">
                  <Trash2 className="w-3.5 h-3.5" /> Remover
                </button>
              </form>
            </div>

            {/* Edit popup */}
            {editingId === insumo.id && (
              <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="card-glass p-6 w-full max-w-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-foreground font-semibold text-base">Editar {insumo.nome}</h3>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground transition">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form method="post" action="/insumos/update" className="space-y-3">
                    <input type="hidden" name="id" value={insumo.id} />
                    <input type="number" step="0.01" name="quantidade" placeholder="Adicionar ou subtrair" className="w-full px-4 py-2.5 rounded-lg bg-input border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
                    <button type="submit" className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
                      Salvar
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EstoqueSection;
