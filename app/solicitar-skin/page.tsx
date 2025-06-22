'use client'

import { SkinRequestButton } from '@/components/SkinRequestModal'
import { DotPattern } from '@/components/ui/dot-pattern'
import { items } from '@/database/script'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TypewriterText } from '@/components/Typerwriter'

export default function SolicitarSkinPage() {
  const handleSkinSelect = (skin: {
    markethashname: string
    itemgroup: string
    itemtype: string
  }) => {
    console.log('Skin selecionada:', skin)
    // Aqui você pode implementar a lógica depois
    alert(`Skin selecionada: ${skin.markethashname}`)
  }

  return (
    <div className="bg-background relative mb-[64px] flex h-[86%] w-full flex-col items-center overflow-hidden">
      {/* Header com botão de voltar - posicionado absolutamente */}
      <div className="absolute top-4 left-4 z-30">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      {/* Conteúdo principal centralizado */}
      <div className="z-10 flex h-full flex-col justify-center max-md:min-h-[30dvh]">
        <div className="space-y-4 text-center">
          <h1 className="px-4 text-center text-3xl font-bold tracking-tighter text-black md:text-4xl lg:text-6xl dark:text-white">
            Não encontrou o que procurava?{' '}
            <span className="text-primary">Solicite.</span>
          </h1>
          <TypewriterText />
        </div>
      </div>

      {/* Botão principal de solicitar skin */}
      <div className="z-20 w-full max-w-md px-4">
        <SkinRequestButton skins={items} onSkinSelect={handleSkinSelect} />
      </div>

      {/* Informações adicionais */}
      <div className="z-20 mt-6 text-center text-sm text-muted-foreground space-y-1">
        <p>
          <strong>{items.length}</strong> skins disponíveis
        </p>
        <p>Use os filtros para encontrar exatamente o que procura</p>
      </div>

      <DotPattern
        className={cn(
          '[mask-image:radial-gradient(200px_circle_at_center,white,transparent)] md:[mask-image:radial-gradient(300px_circle_at_center,white,transparent)] lg:[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]',
        )}
      />
    </div>
  )
}
