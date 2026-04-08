import { DollarSign, Package, Truck } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";

const insights = [
  {
    title: "Total em vendas",
    value: "25,000",
    subtitle: "Total de vendas mês passado: 205.500",
    percentage: 81,
    icon: DollarSign,
    color: "hsl(var(--primary))",
  },
  {
    title: "Produtos em estoque",
    value: "600",
    subtitle: "Produção total do mês passado: 2000",
    percentage: 81,
    icon: Package,
    color: "hsl(var(--destructive))",
  },
  {
    title: "Pedidos em andamento",
    value: "8",
    subtitle: "Total de pedidos mês passado: 70",
    percentage: 81,
    icon: Truck,
    color: "hsl(var(--success))",
  },
];

const recentOrders = [
  { cliente: "João Silva", produto: "Coco 200ml", quantidade: 50, pagamento: "PIX", status: "Aberto" },
  { cliente: "Maria Santos", produto: "Polpa A", quantidade: 30, pagamento: "Cartão", status: "Concluído" },
  { cliente: "Carlos Lima", produto: "Coco 1L", quantidade: 20, pagamento: "Dinheiro", status: "Pendente" },
];

const DashboardSection = () => (
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-left">
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Produto</th>
              <th className="py-3 px-4">Quantidade</th>
              <th className="py-3 px-4">Pagamento</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition">
                <td className="py-3 px-4">{order.cliente}</td>
                <td className="py-3 px-4">{order.produto}</td>
                <td className="py-3 px-4">{order.quantidade}</td>
                <td className="py-3 px-4">{order.pagamento}</td>
                <td className="py-3 px-4">{order.status}</td>
                <td className="py-3 px-4 text-primary cursor-pointer">Details</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="mt-4 text-sm text-primary hover:underline">Mostrar tudo</button>
    </div>
  </div>
);

export default DashboardSection;
