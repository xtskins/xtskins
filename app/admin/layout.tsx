'use client'

// Layout específico para área de admin
// Pode ser client-side já que é área totalmente privada

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-layout">
      {/* Layout simples para admin */}
      {children}
    </div>
  )
}
