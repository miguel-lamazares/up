import { useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardSection from "@/components/sections/DashboardSection";
import ClientesSection from "@/components/sections/ClientesSection";
import PedidosSection from "@/components/sections/PedidosSection";
import ProdutosSection from "@/components/sections/ProdutosSection";
import EstoqueSection from "@/components/sections/EstoqueSection";
import AnalyticsSection from "@/components/sections/AnalyticsSection";

const sections: Record<string, React.FC> = {
  dashboard: DashboardSection,
  clientes: ClientesSection,
  pedidos: PedidosSection,
  produtos: ProdutosSection,
  estoque: EstoqueSection,
  analytics: AnalyticsSection,
};

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const ActiveComponent = sections[activeSection] || DashboardSection;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-full">
        <ActiveComponent />
      </main>
    </div>
  );
};

export default Index;
