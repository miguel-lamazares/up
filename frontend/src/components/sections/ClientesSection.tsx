import { useState } from "react";
import { Users, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
}

const ClientesSection = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");

  const handleAdd = () => {
    if (!nome.trim()) return;
    const novo: Cliente = {
      id: Date.now(),
      nome,
      telefone,
      email,
      endereco,
    };
    setClientes([...clientes, novo]);
    setNome("");
    setTelefone("");
    setEmail("");
    setEndereco("");
    setShowForm(false);
  };

  const handleDelete = (id: number) => {
    setClientes(clientes.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1>Clientes</h1>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2">
          <Plus size={16} />
          Novo Cliente
        </Button>
      </div>

      {showForm && (
        <div className="card-glass p-6 space-y-4">
          <h2>Cadastrar Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do cliente" className="bg-card border-border/40" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" className="bg-card border-border/40" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className="bg-card border-border/40" />
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, cidade" className="bg-card border-border/40" />
            </div>
          </div>
          <Button onClick={handleAdd}>Salvar</Button>
        </div>
      )}

      {clientes.length === 0 ? (
        <div className="card-glass p-10 text-center space-y-4">
          <Users size={48} className="mx-auto text-muted-foreground" />
          <h2>Módulo de Clientes</h2>
          <p className="text-muted-foreground">Gerencie seus clientes aqui. Clique em "Novo Cliente" para começar.</p>
        </div>
      ) : (
        <div className="card-glass overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left">
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Telefone</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Endereço</th>
                <th className="py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition">
                  <td className="py-3 px-4">{c.nome}</td>
                  <td className="py-3 px-4">{c.telefone}</td>
                  <td className="py-3 px-4">{c.email}</td>
                  <td className="py-3 px-4">{c.endereco}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive/80">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientesSection;
