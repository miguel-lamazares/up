import { Users } from "lucide-react";

const ClientesSection = () => (
  <div className="animate-fade-in space-y-6">
    <h1 className="text-foreground">Clientes</h1>
    <div className="card-glass p-12 flex flex-col items-center justify-center text-center">
      <Users className="w-12 h-12 text-muted-foreground mb-4" />
      <h2 className="text-foreground mb-2">Módulo de Clientes</h2>
      <p className="text-muted-foreground text-sm">Gerencie seus clientes aqui. Este módulo será conectado ao seu backend.</p>
    </div>
  </div>
);

export default ClientesSection;
