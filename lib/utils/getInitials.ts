/**
 * Extrai as iniciais do nome do usuário
 * @param name Nome completo do usuário
 * @returns Iniciais em maiúsculo (máximo 2 caracteres)
 *
 * @example
 * getInitials("Lucas Andrade") // "LA"
 * getInitials("João Silva Santos") // "JS"
 * getInitials("Maria") // "M"
 * getInitials("") // "U"
 */
export function getInitials(name: string): string {
  if (!name || name.trim() === '') {
    return 'U' // User fallback
  }

  const names = name
    .trim()
    .split(' ')
    .filter((n) => n.length > 0)

  if (names.length === 1) {
    // Se só tem um nome, pegar primeira letra
    return names[0][0].toUpperCase()
  }

  // Se tem múltiplos nomes, pegar primeira letra do primeiro e último
  const firstInitial = names[0][0].toUpperCase()
  const lastInitial = names[names.length - 1][0].toUpperCase()

  return `${firstInitial}${lastInitial}`
}
