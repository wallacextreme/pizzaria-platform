const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * Prefixa caminhos estáticos locais com basePath (ex: "/pizzaria-platform" no GitHub Pages)
 * sem alterar URLs absolutas, data URIs ou caminhos já prefixados.
 */
export function withBasePath(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (
    !BASE_PATH ||
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:") ||
    path.startsWith(`${BASE_PATH}/`) ||
    path === BASE_PATH
  ) {
    return path;
  }
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
