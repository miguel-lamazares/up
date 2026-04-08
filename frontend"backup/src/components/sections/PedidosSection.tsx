import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const produtosDisponiveis = [
  { id: 1, nome: "Coco 200ml" },
  { id: 2, nome: "Coco 500ml" },
  { id: 3, nome: "Coco 1L" },
  { id: 4, nome: "Polpa A" },
  { id: 5, nome: "Polpa B" },
  { id: 6, nome: "Polpa C" },
];

const pedidosMock = [
  { id: 1, cliente: "João Silva", status: "aberto", data: "01/04/2026 14:30", pagamento: "PIX", valor: 250.0, itens: [{ quantidade: 10, nome: "Coco 200ml", valor: 25.0 }] },
  { id: 2, cliente: "Maria Santos", status: "concluido", data: "28/03/2026 10:00", pagamento: "Cartão", valor: 500.0, itens: [{ quantidade: 20, nome: "Polpa A", valor: 25.0 }] },
];

const PedidosSection = () => {
  const [produtos, setProdutos] = useState([{ id: 0, produtoId: 1, quantidade: "" }]);

  const addProduto = () => {
    setProdutos([...produtos, { id: produtos.length, produtoId: 1, quantidade: "" }]);
  };

  const removeProduto = (index: number) => {
    setProdutos(produtos.filter((_, i) => i !== index));
  };

  const statusColor: Record<string, string> = {
    aberto: "bg-warning/20 text-warning",
    concluido: "bg-success/20 text-success",
    cancelado: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-foreground">Pedidos</h1>

      {/* Form */}
      <div className="card-glass p-6">
        <h3 className="text-foreground text-base font-semibold mb-4">Novo Pedido</h3>
        <form method="post" action="/pedidos/add" className="space-y-4">
          <input
            type="text"
            name="cliente"
            placeholder="Nome do cliente"
            required
            className="w-full px-4 py-2.5 rounded-lg bg-input border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          />
          <select
            name="forma_pagamento"
            required
            className="w-full px-4 py-2.5 rounded-lg bg-input border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          >
            <option value="dinheiro">Dinheiro</option>
            <option value="cartao">Cartão</option>
            <option value="pix">PIX</option>
          </select>

          <div className="space-y-3">
            {produtos.map((item, i) => (
              <div key={item.id} className="flex gap-3 items-center">
                <select
                  name={`produtos[${i}][id]`}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-input border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                >
                  {produtosDisponiveis.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
                <input
                  type="number"
                  name={`produtos[${i}][quantidade]`}
                  placeholder="Qtd"
                  min="1"
                  className="w-24 px-4 py-2.5 rounded-lg bg-input border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                />
                <button
                  type="button"
                  onClick={() => removeProduto(i)}
                  className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={addProduto}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition"
            >
              <Plus className="w-4 h-4" /> Adicionar Produto
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
            >
              Registrar Pedido
            </button>
          </div>
        </form>
      </div>

      {/* Pedidos Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pedidosMock.map((pedido) => (
          <div key={pedido.id} className="card-glass p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-primary font-semibold text-base">Pedido #{pedido.id}</h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[pedido.status]}`}>
                {pedido.status}
              </span>
            </div>
            <p className="text-foreground font-medium">{pedido.cliente}</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Data: {pedido.data}</p>
              <p>Pagamento: {pedido.pagamento}</p>
              <p className="text-foreground font-semibold">Valor: R$ {pedido.valor.toFixed(2)}</p>
            </div>
            <div>
              <h3 className="text-muted-foreground mb-1">Produtos:</h3>
              <ul className="text-sm text-secondary-foreground space-y-0.5">
                {pedido.itens.map((item, i) => (
                  <li key={i}>• {item.quantidade}x {item.nome} (R$ {item.valor.toFixed(2)})</li>
                ))}
              </ul>
            </div>
            <form method="post" action="/pedidos/update" className="flex gap-2 pt-2">
              <input type="hidden" name="pedido_id" value={pedido.id} />
              <select
                name="status"
                defaultValue={pedido.status}
                className="flex-1 px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              >
                <option value="aberto">Aberto</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
                Atualizar
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PedidosSection;
