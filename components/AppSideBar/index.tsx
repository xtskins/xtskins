'use client'

import * as React from 'react'
import { Frame, Instagram, Package } from 'lucide-react'
import { AK47Icon } from '@/components/icons/AK47Icon'

import { NavMain } from '@/components/NavMain'
import { NavProjects } from '@/components/NavProjects'
import { NavUser } from '@/components/NavUser'
import { TeamSwitcher } from '@/components/TeamSwitcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { User } from '@/lib/types/user'
import { SkinType, Skin } from '@/lib/types/skin'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { useAuth } from '@/context/AuthContext'
import { LoginButton } from '@/components/LoginButton'
import { useFilter } from '@/context/FilterContext'
import { WhatsappIcon } from '../icons/WhatsappIcon'
import AdminArea from '../AdminButton'
import { USPIcon } from '../icons/USPIcon'
import { MP9Icon } from '../icons/MP9Icon'
import { AWPIcon } from '../icons/AWPIcon'
import { MachineIcon } from '../icons/MachineIcon'
import { StickerIcon } from '../icons/StickerIcon'
import { AgentIcon } from '../icons/AgentIcon'
import { ShotgunIcon } from '../icons/ShotgunIcon'
import { KnifeIcon } from '../icons/KnifeIcon'

interface ServerUserData {
  user: SupabaseUser | null
  profile: User | null
  skinTypes: SkinType[]
  skins: Skin[]
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  serverUserData?: ServerUserData
}

// Mapeia ícones para diferentes tipos de skin
const getIconForType = (type: string) => {
  switch (type.toLowerCase()) {
    case 'rifle':
      return AK47Icon
    case 'machinegun':
      return MachineIcon
    case 'pistol':
      return USPIcon
    case 'smg':
      return MP9Icon
    case 'sniper rifle':
      return AWPIcon
    case `sticker`:
      return StickerIcon
    case `agent`:
      return AgentIcon
    case `shotgun`:
      return ShotgunIcon
    case `knife`:
      return KnifeIcon
    default:
      return Frame
  }
}

const createNavMainFromSkinTypes = (skinTypes: SkinType[]) => {
  return skinTypes.map((skinType) => ({
    title: skinType.type,
    url: '#',
    icon: getIconForType(skinType.type),
    isActive: false,
    items: skinType.sub_types.map((subType) => ({
      title: subType,
      url: '#',
    })),
  }))
}

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  projects: [
    {
      name: 'WhatsApp',
      url: 'https://wa.link/f2um94',
      icon: WhatsappIcon,
      target: '_blank',
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/xtskins/',
      icon: Instagram,
      target: '_blank',
    },
    {
      name: 'Solicitar Skin',
      url: '/solicitar-skin',
      icon: Package,
      target: '_self',
    },
  ],
}

export function AppSidebar({ serverUserData, ...props }: AppSidebarProps) {
  const { profile } = useAuth()
  const { setFilter, filterState, clearFilters } = useFilter()

  const currentProfile = profile || serverUserData?.profile
  const skinTypes = serverUserData?.skinTypes || []
  const navMain = createNavMainFromSkinTypes(skinTypes)

  const handleSubItemClick = (type: string, subType: string) => {
    setFilter(type, subType)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={navMain}
          onSubItemClick={handleSubItemClick}
          onClearFilters={clearFilters}
          activeSubType={filterState.selectedSubType}
        />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        {currentProfile?.role === 'admin' && (
          <AdminArea isSteamIdConfirmed={!!currentProfile?.steam_id} />
        )}
        {currentProfile ? (
          <NavUser
            user={{
              name: currentProfile.name,
              email: currentProfile.email,
              avatar_url: currentProfile.avatar_url || '',
              level: currentProfile.level,
            }}
            loading={false}
          />
        ) : (
          <LoginButton />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
