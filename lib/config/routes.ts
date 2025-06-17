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
  admin: {
    label: 'Painel do Administrador',
    path: '/admin',
    parent: 'home',
  },
  profile: {
    label: 'Perfil',
    path: '/profile',
  },
}

export function getBreadcrumbsForPath(currentPath: string): RouteConfig[] {
  const matchesRoute = (routePath: string, currentPath: string): boolean => {
    if (!routePath.includes('[') || !routePath.includes(']')) {
      return routePath === currentPath
    }

    const regexPattern = routePath
      .replace(/\[([^\]]+)\]/g, '[^/]+')
      .replace(/\//g, '\\/')

    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(currentPath)
  }

  const currentRoute = Object.values(routes).find((route) =>
    matchesRoute(route.path, currentPath),
  )

  if (!currentRoute) {
    return [routes.home]
  }

  const breadcrumbs: RouteConfig[] = [currentRoute]

  let parent = currentRoute.parent
  while (parent && routes[parent]) {
    breadcrumbs.unshift(routes[parent])
    parent = routes[parent].parent
  }

  return breadcrumbs
}
