import { BarChart3 } from "lucide-react";

const AnalyticsSection = () => (
  <div className="animate-fade-in space-y-6">
    <h1 className="text-foreground">Analytics</h1>
    <div className="card-glass p-12 flex flex-col items-center justify-center text-center">
      <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
      <h2 className="text-foreground mb-2">Análises e Relatórios</h2>
      <p className="text-muted-foreground text-sm">Visualize métricas e relatórios do seu negócio aqui.</p>
    </div>
  </div>
);

export default AnalyticsSection;
