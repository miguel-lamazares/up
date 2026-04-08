import { useEffect, useState } from "react";
import { Plus, Minus } from "lucide-react";

const produtosDisponiveis = [
  { id: 1, nome: "Coco 200ml" },
  { id: 2, nome: "Coco 500ml" },
  { id: 3, nome: "Coco 1L" },
  { id: 4, nome: "Polpa A" },
  { id: 5, nome: "Polpa B" },
  { id: 6, nome: "Polpa C" },
];

const PedidosSection = () => {
  const [cliente, setCliente] = useState("");
  const [pagamento, setPagamento] = useState("Dinheiro");
  const [produtos, setProdutos] = useState([
    { id: 0, produtoId: 1, quantidade: "", valor: "" },
  ]);
  const [pedidos, setPedidos] = useState<any[]>([]);

  const token = localStorage.getItem("token");

  const carregarPedidos = async () => {
    const res = await fetch("/api/pedidos/list", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      setPedidos(data);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const addProduto = () => {
    setProdutos([
      ...produtos,
      {
        id: produtos.length,
        produtoId: 1,
        quantidade: "",
        valor: "",
      },
    ]);
  };

  const removeProduto = (index: number) => {
    setProdutos(produtos.filter((_, i) => i !== index));
  };

  const registrarPedido = async () => {
    const itens = produtos.map((p) => ({
      produto_id: p.produtoId,
      quantidade: Number(p.quantidade),
      valor_unitario: Number(p.valor),
    }));

    const valor_total = itens.reduce(
      (acc, item) => acc + item.quantidade * item.valor_unitario,
      0
    );

    const res = await fetch("/api/pedidos/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cliente,
        forma_pagamento: pagamento,
        valor_total,
        itens,
      }),
    });

    if (res.ok) {
      setCliente("");
      setProdutos([{ id: 0, produtoId: 1, quantidade: "", valor: "" }]);
      carregarPedidos();
    } else {
      alert("Erro ao registrar pedido");
    }
  };

  const handleCancelar = async (pedidoId: number) => {
    if (!confirm("Deseja cancelar este pedido?")) return;

    const res = await fetch(`/api/pedidos/${pedidoId}/cancelar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      carregarPedidos();
    }
  };

  const statusColor: Record<string, string> = {
    aberto: "bg-warning/20 text-warning",
    concluido: "bg-success/20 text-success",
    cancelado: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="space-y-8">
      <h1>Pedidos</h1>

      <div className="card-glass p-6 space-y-4">
        <h3 className="text-foreground text-base font-semibold">
          Novo Pedido
        </h3>

        <input
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          placeholder="Cliente"
          className="w-full px-4 py-2.5 rounded-lg bg-input border border-border/40"
        />

        <select
          value={pagamento}
          onChange={(e) => setPagamento(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-input border border-border/40"
        >
          <option>Dinheiro</option>
          <option>Cartão</option>
          <option>PIX</option>
        </select>

        {produtos.map((item, i) => (
          <div key={item.id} className="flex gap-2 items-center">
            <select
              value={item.produtoId}
              onChange={(e) => {
                const novos = [...produtos];
                novos[i].produtoId = Number(e.target.value);
                setProdutos(novos);
              }}
              className="flex-1 px-4 py-2.5 rounded-lg bg-input border border-border/40"
            >
              {produtosDisponiveis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>

            <input
              placeholder="Qtd"
              type="number"
              value={item.quantidade}
              onChange={(e) => {
                const novos = [...produtos];
                novos[i].quantidade = e.target.value;
                setProdutos(novos);
              }}
              className="w-20 px-3 py-2.5 rounded-lg bg-input border border-border/40"
            />

            <input
              placeholder="R$ Valor"
              type="number"
              value={item.valor}
              onChange={(e) => {
                const novos = [...produtos];
                novos[i].valor = e.target.value;
                setProdutos(novos);
              }}
              className="w-24 px-3 py-2.5 rounded-lg bg-input border border-border/40"
            />

            <button onClick={() => removeProduto(i)}>
              <Minus size={16} />
            </button>
          </div>
        ))}

        <button onClick={addProduto} className="flex items-center gap-2">
          <Plus size={16} /> Adicionar Produto
        </button>

        <button
          onClick={registrarPedido}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground"
        >
          Registrar Pedido
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="card-glass p-6 space-y-4">
            <div className="flex justify-between">
              <h3>Pedido #{pedido.id}</h3>
              <span className={statusColor[pedido.status] || ""}>
                {pedido.status}
              </span>
            </div>

            <p>{pedido.cliente}</p>
            <p>Pagamento: {pedido.forma_pagamento}</p>
            <p>Valor: R$ {Number(pedido.valor_total).toFixed(2)}</p>

            <div className="flex gap-2">
              {pedido.status !== "cancelado" && (
                <button onClick={() => handleCancelar(pedido.id)}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PedidosSection;