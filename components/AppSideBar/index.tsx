'use client'

import * as React from 'react'
import {
  BookOpen,
  Bot,
  Frame,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from 'lucide-react'

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
      return SquareTerminal
    case 'machinegun':
      return Bot
    case 'pistol':
      return BookOpen
    case 'smg':
      return Settings2
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
      name: 'Design Engineering',
      url: '#',
      icon: Frame,
    },
    {
      name: 'Sales & Marketing',
      url: '#',
      icon: PieChart,
    },
    {
      name: 'Travel',
      url: '#',
      icon: Map,
    },
  ],
}

export function AppSidebar({ serverUserData, ...props }: AppSidebarProps) {
  const { profile } = useAuth()

  const currentProfile = profile || serverUserData?.profile
  const skinTypes = serverUserData?.skinTypes || []
  const navMain = createNavMainFromSkinTypes(skinTypes)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        {currentProfile ? (
          <NavUser
            user={{
              name: currentProfile.name,
              email: currentProfile.email,
              avatar_url: currentProfile.avatar_url,
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
