import { useState, useEffect } from "react";
import { Plus, Minus, AlertCircle } from "lucide-react";
import { listarPedidos, listarInsumos, criarPedido, cancelarPedido, Pedido, Insumo } from "@/services/api";

const PedidosSection = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [cliente, setCliente] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [itensForm, setItensForm] = useState([{ produtoId: 0, quantidade: "", valorUnitario: "" }]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([listarPedidos(), listarInsumos()])
      .then(([p, i]) => {
        setPedidos(p);
        // Produtos acabados são insumos com unidade "un"
        setProdutosDisponiveis(i);
        if (i.length > 0 && itensForm[0].produtoId === 0) {
          setItensForm([{ produtoId: i[0].id, quantidade: "", valorUnitario: "" }]);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const addProduto = () => {
    const defaultId = produtosDisponiveis.length > 0 ? produtosDisponiveis[0].id : 0;
    setItensForm([...itensForm, { produtoId: defaultId, quantidade: "", valorUnitario: "" }]);
  };

  const removeProduto = (index: number) => {
    setItensForm(itensForm.filter((_, i) => i !== index));
  };

  const handleRegistrar = async () => {
    if (!cliente.trim()) { alert("Informe o cliente."); return; }
    const itens = itensForm
      .filter((i) => i.quantidade && i.valorUnitario)
      .map((i) => ({ produto_id: i.produtoId, quantidade: Number(i.quantidade), valor_unitario: Number(i.valorUnitario) }));
    if (itens.length === 0) { alert("Adicione pelo menos um produto."); return; }
    const valorTotal = itens.reduce((acc, i) => acc + i.quantidade * i.valor_unitario, 0);

    try {
      await criarPedido(cliente, formaPagamento, valorTotal, itens);
      setCliente("");
      setFormaPagamento("Dinheiro");
      setItensForm([{ produtoId: produtosDisponiveis[0]?.id || 0, quantidade: "", valorUnitario: "" }]);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const handleCancelar = async (pedidoId: number) => {
    if (!confirm("Deseja cancelar este pedido? Os produtos retornarão ao estoque.")) return;
    try { await cancelarPedido(pedidoId); fetchData(); } catch (e: any) { alert(e.message); }
  };

  const statusColor: Record<string, string> = {
    aberto: "bg-warning/20 text-warning",
    concluido: "bg-success/20 text-success",
    cancelado: "bg-destructive/20 text-destructive",
  };

  if (loading) return <div className="space-y-8"><h1>Pedidos</h1><p className="text-muted-foreground">Carregando...</p></div>;
  if (error) return <div className="space-y-8"><h1>Pedidos</h1><div className="card-glass p-6 flex items-center gap-3 text-destructive"><AlertCircle size={20} /><p>{error}</p></div></div>;

  return (
    <div className="space-y-8">
      <h1>Pedidos</h1>

      {/* Form */}
      <div className="card-glass p-6 space-y-4">
        <h3 className="text-foreground text-base font-semibold">Novo Pedido</h3>

        <input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Cliente" className="w-full px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground placeholder:text-muted-foreground text-sm" />

        <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm">
          <option>Dinheiro</option>
          <option>Cartão</option>
          <option>PIX</option>
        </select>

        {itensForm.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <select
              value={item.produtoId}
              onChange={(e) => {
                const updated = [...itensForm];
                updated[i] = { ...updated[i], produtoId: Number(e.target.value) };
                setItensForm(updated);
              }}
              className="flex-1 px-4 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm"
            >
              {produtosDisponiveis.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
            <input
              value={item.quantidade}
              onChange={(e) => {
                const updated = [...itensForm];
                updated[i] = { ...updated[i], quantidade: e.target.value };
                setItensForm(updated);
              }}
              placeholder="Qtd" type="number" className="w-20 px-3 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm"
            />
            <input
              value={item.valorUnitario}
              onChange={(e) => {
                const updated = [...itensForm];
                updated[i] = { ...updated[i], valorUnitario: e.target.value };
                setItensForm(updated);
              }}
              placeholder="R$ Valor" type="number" className="w-24 px-3 py-2.5 rounded-lg bg-input border border-border/40 text-foreground text-sm"
            />
            <button onClick={() => removeProduto(i)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition">
              <Minus size={16} />
            </button>
          </div>
        ))}

        <button onClick={addProduto} className="flex items-center gap-2 text-sm text-primary hover:underline">
          <Plus size={16} /> Adicionar Produto
        </button>

        <button onClick={handleRegistrar} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition">
          Registrar Pedido
        </button>
      </div>

      {/* Pedidos Cards */}
      {pedidos.length === 0 ? (
        <div className="card-glass p-10 text-center">
          <p className="text-muted-foreground">Nenhum pedido registrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="card-glass p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-foreground text-base font-semibold">Pedido #{pedido.id}</h3>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor[pedido.status] || ""}`}>
                  {pedido.status}
                </span>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>{pedido.cliente}</p>
                <p>Data: {pedido.data_pedido}</p>
                <p>Pagamento: {pedido.forma_pagamento}</p>
                <p className="text-foreground font-semibold">Valor: R$ {Number(pedido.valor_total).toFixed(2)}</p>
              </div>

              {pedido.itens && pedido.itens.length > 0 && (
                <div>
                  <h3 className="text-foreground mb-2">Produtos:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {pedido.itens.map((item, i) => (
                      <li key={i}>• {item.quantidade}x (R$ {Number(item.valor_unitario).toFixed(2)})</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {pedido.status !== "cancelado" && (
                  <button
                    onClick={() => handleCancelar(pedido.id)}
                    className="flex-1 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition"
                  >
                    Cancelar
                  </button>
                )}
                {pedido.status === "aberto" && (
                  <button className="flex-1 py-2 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition">
                    Concluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PedidosSection;
