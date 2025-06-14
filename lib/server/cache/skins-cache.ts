import {
  getAllSkinsServerData,
  getSkinsServerData,
} from '../data/skins/getSkinsServerData'
import { Skin, SkinType } from '@/lib/types/skin'

let skinsCache: {
  skins: Skin[]
  skinTypes: SkinType[]
  lastUpdate: number
  ttl: number
} | null = null

let isUpdating = false
let updatePromise: Promise<void> | null = null

const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export async function getCachedSkins() {
  const now = Date.now()

  if (!skinsCache || now - skinsCache.lastUpdate > skinsCache.ttl) {
    if (isUpdating && updatePromise) {
      await updatePromise
      return {
        skins: skinsCache!.skins,
        skinTypes: skinsCache!.skinTypes,
      }
    }

    isUpdating = true
    updatePromise = Promise.all([getAllSkinsServerData(), getSkinsServerData()])
      .then(([allSkinsData, skinsData]) => {
        skinsCache = {
          skins: allSkinsData.skins,
          skinTypes: skinsData.skinTypes,
          lastUpdate: Date.now(),
          ttl: CACHE_TTL,
        }
      })
      .finally(() => {
        isUpdating = false
        updatePromise = null
      })

    await updatePromise
  }

  return {
    skins: skinsCache!.skins,
    skinTypes: skinsCache!.skinTypes,
  }
}
