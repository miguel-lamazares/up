import { BarChart3 } from "lucide-react";

const AnalyticsSection = () => (
  <div className="space-y-8">
    <h1>Analytics</h1>
    <div className="card-glass p-10 text-center space-y-4">
      <BarChart3 size={48} className="mx-auto text-muted-foreground" />
      <h2>Análises e Relatórios</h2>
      <p className="text-muted-foreground">Visualize métricas e relatórios do seu negócio aqui.</p>
    </div>
  </div>
);

export default AnalyticsSection;
