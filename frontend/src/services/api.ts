// Base URL for the FastAPI backend
// In development, Vite proxy will forward /api to the backend
// In production, set VITE_API_BASE to your FastAPI server URL
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export async function api<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Erro ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return {} as T;
}

// ---- Auth ----
export async function loginUser(username: string, password: string) {
  return api<{ token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function logoutUser() {
  return api("/auth/logout", { method: "POST" });
}

// ---- Insumos (Estoque) ----
export interface Lote {
  id: number;
  lote: string;
  quantidade: number;
  validade: string | null;
}

export interface Insumo {
  id: number;
  nome: string;
  quantidade: number;
  unidade: string;
  lotes: Lote[];
}

export async function listarInsumos(): Promise<Insumo[]> {
  const insumos = await api<Insumo[]>("/insumos/list");
  return insumos;
}

export async function criarInsumo(nome: string, quantidade: number, unidade: string) {
  return api("/insumos/add", {
    method: "POST",
    body: JSON.stringify({ nome, quantidade, unidade }),
  });
}

export async function deletarInsumo(id: number) {
  return api("/insumos/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function atualizarInsumo(id: number, quantidade: number) {
  return api("/insumos/update", {
    method: "POST",
    body: JSON.stringify({ id, quantidade }),
  });
}

export async function adicionarLote(
  insumo_id: number | null,
  quantidade: number,
  lote?: string,
  validade?: string,
  nome?: string,
  unidade?: string
) {
  return api("/insumos/lote/add", {
    method: "POST",
    body: JSON.stringify({ insumo_id, quantidade, lote, validade, nome, unidade }),
  });
}

export async function consumirLote(lote_id: number, quantidade: number) {
  return api("/insumos/lote/consumir", {
    method: "POST",
    body: JSON.stringify({ lote_id, quantidade }),
  });
}

// ---- Produtos ----
export async function adicionarProduto(
  produto_nome: string,
  quantidade: number,
  lote: string,
  validade: string,
  insumos_consumidos: { insumo_id: number; quantidade: number }[]
) {
  return api("/produtos/add", {
    method: "POST",
    body: JSON.stringify({ produto_nome, quantidade, lote, validade, insumos_consumidos }),
  });
}

// ---- Pedidos ----
export interface PedidoItem {
  produto_id: number;
  quantidade: number;
  valor_unitario: number;
}

export interface Pedido {
  id: number;
  cliente: string;
  forma_pagamento: string;
  valor_total: number;
  status: string;
  data_pedido: string;
  itens: PedidoItem[];
}

export async function criarPedido(
  cliente: string,
  forma_pagamento: string,
  valor_total: number,
  itens: PedidoItem[]
) {
  return api<{ status: string; pedido_id: number }>("/pedidos/add", {
    method: "POST",
    body: JSON.stringify({ cliente, forma_pagamento, valor_total, itens }),
  });
}

export async function listarPedidos(): Promise<Pedido[]> {
  return api<Pedido[]>("/pedidos/list");
}

export async function obterPedido(pedido_id: number): Promise<Pedido> {
  return api<Pedido>(`/pedidos/${pedido_id}`);
}

export async function cancelarPedido(pedido_id: number) {
  return api<{ status: string }>(`/pedidos/${pedido_id}/cancelar`, {
    method: "POST",
  });
}

// ---- Clientes ----
export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
}

export async function listarClientes(): Promise<Cliente[]> {
  return api<Cliente[]>("/clientes/list");
}

export async function criarCliente(data: Omit<Cliente, "id">) {
  return api<{ id: number }>("/clientes/add", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deletarCliente(id: number) {
  return api("/clientes/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
