import { useEffect, useState } from "react";
import { DollarSign, Package, Truck, AlertCircle } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";
import { listarPedidos, listarInsumos, Pedido, Insumo } from "@/services/api";

const DashboardSection = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([listarPedidos(), listarInsumos()])
      .then(([p, i]) => {
        setPedidos(p);
        setInsumos(i);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h1>Dashboard</h1>
        <div className="card-glass p-6 flex items-center gap-3 text-destructive">
          <AlertCircle size={20} />
          <p>Erro ao carregar dados: {error}</p>
        </div>
      </div>
    );
  }

  const pedidosAbertos = pedidos.filter((p) => p.status === "aberto");
  const pedidosConcluidos = pedidos.filter((p) => p.status === "concluido");
  const totalVendas = pedidosConcluidos.reduce((acc, p) => acc + Number(p.valor_total), 0);
  const totalEstoque = insumos.reduce((acc, i) => acc + Number(i.quantidade), 0);

  const insights = [
    {
      title: "Total em vendas",
      value: `R$ ${totalVendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      subtitle: `${pedidosConcluidos.length} pedidos concluídos`,
      percentage: pedidos.length > 0 ? Math.round((pedidosConcluidos.length / pedidos.length) * 100) : 0,
      color: "hsl(var(--primary))",
    },
    {
      title: "Produtos em estoque",
      value: String(totalEstoque),
      subtitle: `${insumos.length} itens cadastrados`,
      percentage: totalEstoque > 0 ? Math.min(100, Math.round((totalEstoque / Math.max(totalEstoque, 1)) * 100)) : 0,
      color: "hsl(var(--destructive))",
    },
    {
      title: "Pedidos em andamento",
      value: String(pedidosAbertos.length),
      subtitle: `${pedidos.length} pedidos no total`,
      percentage: pedidos.length > 0 ? Math.round((pedidosAbertos.length / pedidos.length) * 100) : 0,
      color: "hsl(var(--success))",
    },
  ];

  const recentOrders = pedidos.slice(0, 5);

  return (
    <div className="space-y-8">
      <h1>Dashboard</h1>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {insights.map((item) => (
          <div key={item.title} className="card-glass p-6 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-muted-foreground">{item.title}</h3>
              <p className="text-3xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
            <ProgressRing percentage={item.percentage} color={item.color} />
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card-glass p-6">
        <h2 className="mb-4">Últimos pedidos</h2>
        {recentOrders.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum pedido registrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30 transition">
                    <td className="py-3 px-4">{order.cliente}</td>
                    <td className="py-3 px-4">R$ {Number(order.valor_total).toFixed(2)}</td>
                    <td className="py-3 px-4">{order.forma_pagamento}</td>
                    <td className="py-3 px-4">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardSection;
