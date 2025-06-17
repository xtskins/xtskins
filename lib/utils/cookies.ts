import { cookies } from 'next/headers'

export async function getSidebarState(): Promise<boolean> {
  const cookieStore = await cookies()
  const sidebarState = cookieStore.get('sidebar_state')

  // Se não existe o cookie, retorna true (padrão: aberto)
  if (!sidebarState) {
    return true
  }

  // Converte string para boolean
  return sidebarState.value === 'true'
}
