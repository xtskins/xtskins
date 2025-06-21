'use client'

import { SkinRequestButton } from '@/components/SkinRequestModal'

interface SkinData {
  markethashname: string
  itemgroup: string
  itemtype: string
}

interface ClientSkinRequestButtonProps {
  skins: SkinData[]
}

export function ClientSkinRequestButton({
  skins,
}: ClientSkinRequestButtonProps) {
  const handleSkinSelect = (skin: SkinData) => {
    console.log('Skin selecionada:', skin)
    // Aqui você pode implementar a lógica depois
    alert(`Skin selecionada: ${skin.markethashname}`)
  }

  return <SkinRequestButton skins={skins} onSkinSelect={handleSkinSelect} />
}
