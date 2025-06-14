'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/context/AuthContext'
import { LogIn } from 'lucide-react'

export function LoginButton() {
  const { signInWithGoogle } = useAuth()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
          onClick={signInWithGoogle}
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
              XT
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium flex items-center gap-2">
              <LogIn className="size-4" />
              Login
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Juntar-se a XT Skins agora!
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
