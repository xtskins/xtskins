'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return null // Redirecionando...
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Área do Administrador</h1>
      <div className="grid gap-6">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Atualizar Inventário</h2>
          <p className="text-gray-600">
            Aqui você pode gerenciar suas skins, adicionar novas ao inventário e
            remover as que foram vendidas.
          </p>
          {/* Seus componentes de admin aqui */}
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Estatísticas</h2>
          <p className="text-gray-600">
            Visualize estatísticas de vendas e visitantes.
          </p>
        </div>
      </div>
    </div>
  )
}
