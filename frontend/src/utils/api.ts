/**
 * api.ts — Utilitário central de requisições autenticadas
 *
 * Exporta:
 *  - apiFetch(url, options) → fetch com Authorization automático
 *  - getAuthHeaders() → HeadersInit com o token JWT
 *  - getLoggedUser() → { nome, login, setor } do usuário logado
 *  - installFetchInterceptor() → sobrescreve window.fetch globalmente
 *
 * O interceptor global garante que TODAS as chamadas para /api/*
 * recebam o header Authorization, corrigindo o problema de produção
 * onde o proxy do Vite não existe e o tenantMiddleware exige o token.
 */

// ─── Utilitários de token ───────────────────────────────────────────────────

export function getToken(): string | null {
  return (
    localStorage.getItem('sinco_token') ||
    localStorage.getItem('superadmin_token') ||
    null
  );
}

export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Retorna os dados do usuário logado a partir do localStorage */
export function getLoggedUser(): { nome: string; login: string; setor: string; dbName: string } {
  try {
    const raw = localStorage.getItem('sinco_user');
    if (!raw) return { nome: 'Sistema', login: 'sistema', setor: '', dbName: '' };
    const u = JSON.parse(raw);
    return {
      nome: u.NomeCompleto || u.nome || u.name || u.login || 'Sistema',
      login: u.login || u.nome || 'sistema',
      setor: u.setor || '',
      dbName: u.dbName || '',
    };
  } catch {
    return { nome: 'Sistema', login: 'sistema', setor: '', dbName: '' };
  }
}

// ─── fetch autenticado ──────────────────────────────────────────────────────

/**
 * Substituto direto de window.fetch que injeta Authorization
 * automaticamente para qualquer URL relativa /api/* ou absoluta *sinco.lynxems*
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const isApiCall = url.startsWith('/api') || url.includes('/api/') || url.includes('sinco.lynxems.com.br');

  if (isApiCall) {
    const token = getToken();
    if (token) {
      init = init ?? {};
      const existingHeaders = new Headers(init.headers as HeadersInit | undefined);
      if (!existingHeaders.has('Authorization')) {
        existingHeaders.set('Authorization', `Bearer ${token}`);
      }
      if (!existingHeaders.has('Content-Type') && !init.body) {
        // só setamos Content-Type se não houver body (FormData, etc.)
      }
      init = { ...init, headers: existingHeaders };
    }
  }

  return originalFetch(input as RequestInfo, init);
}

// ─── Interceptor Global ─────────────────────────────────────────────────────

const originalFetch = window.fetch.bind(window);

/**
 * Instala o interceptor global uma única vez.
 * Deve ser chamado em main.tsx antes de renderizar a aplicação.
 */
export function installFetchInterceptor(): void {
  if ((window as any).__sincoFetchInterceptorInstalled) return;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.href
        : (input as Request).url;

    const isApiCall =
      url.startsWith('/api') ||
      url.includes('/api/') ||
      url.includes('sinco.lynxems.com.br');

    if (isApiCall) {
      const token = getToken();
      if (token) {
        init = init ?? {};
        const headers = new Headers(init.headers as HeadersInit | undefined);
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        init = { ...init, headers };
      }
    }

    const response = await originalFetch(input as RequestInfo, init);

    // Dispara evento de expiração de sessão em 401/403
    if ((response.status === 401 || response.status === 403) && isApiCall) {
      // Evitar loop no login
      if (!url.includes('/api/login')) {
        console.warn(`[API] Sessão expirada ou sem permissão (${response.status}) para ${url}`);
        // Não dispara logout automático — apenas loga para não interromper UX
      }
    }

    return response;
  };

  (window as any).__sincoFetchInterceptorInstalled = true;
  console.log('[API] Interceptor global de autenticação instalado.');
}
