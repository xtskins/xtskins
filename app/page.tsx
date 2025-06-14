import SkinCard from '@/components/SkinCard'
import { getAllSkinsServerData } from '@/lib/server/data/skins/getSkinsServerData'

export default async function Page() {
  const { skins } = await getAllSkinsServerData()

  if (!skins || skins.length === 0) {
    return (
      <div className="bg-background relative mb-[64px] flex h-[86%] w-full flex-col items-center overflow-hidden">
        <div className="z-10 flex h-full flex-col items-center justify-center max-md:min-h-[30dvh]">
          <p>Nenhuma skin encontrada.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background relative mb-[64px] flex h-[86%] w-full flex-col items-center overflow-hidden p-4">
      <div className="z-10 flex h-full w-full max-w-7xl flex-col">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {skins.map((skin) => (
            <div key={skin.id} className="flex justify-center">
              <SkinCard skinData={skin} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
