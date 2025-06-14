interface RouteConfig {
  label: string
  path: string
  parent?: string
}

export const routes: Record<string, RouteConfig> = {
  home: {
    label: 'Skins disponíveis',
    path: '/',
  },
  copys: {
    label: 'Copys',
    path: '/copys',
    parent: 'home',
  },
  copy: {
    label: 'Resumo',
    path: '/copys/[id]',
    parent: 'copys',
  },
  insights: {
    label: 'Insights',
    path: '/copys/insights',
    parent: 'copys',
  },
  anuncios: {
    label: 'Anúncios',
    path: '/anuncios',
    parent: 'home',
  },
  suporte: {
    label: 'Suporte',
    path: '/suporte',
    parent: 'home',
  },
  settings: {
    label: 'Configurações',
    path: '/settings',
    parent: 'home',
  },
  stores: {
    label: 'Lojas',
    path: '/settings/stores',
    parent: 'settings',
  },
  billing: {
    label: 'Faturamento',
    path: '/settings/billing',
    parent: 'settings',
  },
  playground: {
    label: 'Copy',
    path: '/playground',
    parent: 'home',
  },
}

export function getBreadcrumbsForPath(currentPath: string): RouteConfig[] {
  // Função para verificar se um path dinâmico corresponde ao path atual
  const matchesRoute = (routePath: string, currentPath: string): boolean => {
    // Se não tem parâmetros dinâmicos, faz match exato
    if (!routePath.includes('[') || !routePath.includes(']')) {
      return routePath === currentPath
    }

    // Converte o path da rota em regex para match com parâmetros dinâmicos
    const regexPattern = routePath
      .replace(/\[([^\]]+)\]/g, '[^/]+') // Substitui [id] por [^/]+
      .replace(/\//g, '\\/') // Escapa as barras

    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(currentPath)
  }

  // Encontra a rota atual considerando rotas dinâmicas
  const currentRoute = Object.values(routes).find((route) =>
    matchesRoute(route.path, currentPath),
  )

  if (!currentRoute) {
    // Se não encontrar a rota, retorna apenas o home
    return [routes.home]
  }

  const breadcrumbs: RouteConfig[] = [currentRoute]

  // Adiciona os parents recursivamente
  let parent = currentRoute.parent
  while (parent && routes[parent]) {
    breadcrumbs.unshift(routes[parent])
    parent = routes[parent].parent
  }

  return breadcrumbs
}
