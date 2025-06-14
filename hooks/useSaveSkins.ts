import { useMutation } from '@tanstack/react-query'
import { skinApi } from '@/lib/api/skinApi'
import { ExternalSkinData } from '@/lib/types/skin'

interface SaveSkinsVariables {
  skins: ExternalSkinData[]
  steamId?: string
}

export function useSaveSkins() {
  return useMutation({
    mutationFn: ({ skins, steamId }: SaveSkinsVariables) =>
      skinApi.saveSkins(skins, steamId),
    onSuccess: (data) => {
      console.log('Skins salvas com sucesso:', data)
    },
    onError: (error) => {
      console.error('Erro ao salvar skins:', error)
    },
  })
}
