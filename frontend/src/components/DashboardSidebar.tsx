import { useState } from "react";
import { LayoutDashboard, Users, FileText, Package, Warehouse, BarChart3, LogOut, X, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

interface DashboardSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "pedidos", label: "Pedidos", icon: FileText },
  { id: "produtos", label: "Produtos", icon: Package },
  { id: "estoque", label: "Estoque", icon: Warehouse },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

const DashboardSidebar = ({ activeSection, onSectionChange }: DashboardSidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id: string) => {
    onSectionChange(id);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    if (!confirm("Deseja realmente sair?")) return;
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) window.location.href = "/login";
      else alert("Falha ao deslogar. Tente novamente.");
    } catch {
      alert("Erro de rede no logout.");
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full p-4">
      {/* Logo */}
      <div className="flex items-center justify-between mb-8">
        <img src={logo} alt="Sabor do Vale" className="h-10 object-contain" />
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-muted-foreground hover:text-foreground transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all",
              activeSection === item.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground glow-border"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all mt-4"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-card text-foreground"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 h-full bg-sidebar border-r border-sidebar-border animate-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 w-64 bg-sidebar border-r border-sidebar-border">
        {sidebarContent}
      </aside>
    </>
  );
};

export default DashboardSidebar;
