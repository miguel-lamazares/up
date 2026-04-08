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
  <div className="animate-fade-in space-y-6">
    <h1 className="text-foreground">Dashboard</h1>

    {/* Insight Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {insights.map((item) => (
        <div
          key={item.title}
          className="card-glass p-6 hover:glow-border transition-all duration-300 group"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: `${item.color}20`, color: item.color }}
          >
            <item.icon className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-muted-foreground">{item.title}</h3>
              <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
            </div>
            <ProgressRing percentage={item.percentage} color={item.color} />
          </div>
          <p className="text-xs text-muted-foreground mt-4">{item.subtitle}</p>
        </div>
      ))}
    </div>

    {/* Recent Orders */}
    <div className="card-glass p-6">
      <h2 className="text-foreground mb-4">Últimos pedidos</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cliente</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Produto</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Quantidade</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Pagamento</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order, i) => (
              <tr key={i} className="border-b border-border/30 last:border-none hover:bg-muted/30 transition">
                <td className="py-3 px-4 text-foreground">{order.cliente}</td>
                <td className="py-3 px-4 text-secondary-foreground">{order.produto}</td>
                <td className="py-3 px-4 text-secondary-foreground">{order.quantidade}</td>
                <td className="py-3 px-4 text-secondary-foreground">{order.pagamento}</td>
                <td className="py-3 px-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/20 text-warning">
                    {order.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button className="text-primary text-xs font-medium hover:underline">Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="block w-full text-center text-primary text-sm font-medium mt-4 hover:underline">
        Mostrar tudo
      </button>
    </div>
  </div>
);

export default DashboardSection;
