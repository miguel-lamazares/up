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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1>Estoque de Insumos</h1>
        <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
          Adicionar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insumosMock.map((insumo) => (
          <div key={insumo.id} className="card-glass p-6 space-y-3 relative">
            <h3 className="text-foreground text-base font-semibold">{insumo.nome}</h3>
            <p className="text-2xl font-bold text-primary">{insumo.quantidade} {insumo.unidade}</p>

            {insumo.lotes.length > 0 ? (
              insumo.lotes.map((lote, i) => (
                <div key={i} className="text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
                  Lote {lote.lote} — {lote.validade ? `Vence em ${lote.validade}` : "Não perecível"}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">Sem lotes cadastrados</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingId(insumo.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition"
              >
                <Pencil size={14} /> Editar
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition">
                <Trash2 size={14} /> Remover
              </button>
            </div>

            {/* Edit popup */}
            {editingId === insumo.id && (
              <div className="absolute inset-0 bg-card/95 backdrop-blur rounded-xl p-6 flex flex-col gap-4 z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-foreground text-base font-semibold">Editar {insumo.nome}</h3>
                  <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground transition">
                    <X size={18} />
                  </button>
                </div>
                <input placeholder="Quantidade" type="number" className="px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm" />
                <button className="py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition">
                  Salvar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EstoqueSection;
