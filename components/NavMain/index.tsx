'use client'

import { ChevronRight, type LucideIcon, X } from 'lucide-react'
import { useState } from 'react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'

export function NavMain({
  items,
  onSubItemClick,
  onClearFilters,
  activeSubType,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
  onSubItemClick?: (type: string, subType: string) => void
  onClearFilters?: () => void
  activeSubType?: string | null
}) {
  const { state, setOpen } = useSidebar()
  const [clickedItem, setClickedItem] = useState<string | null>(null)

  const handleTypeClick = () => {
    // Se a sidebar está colapsada (minimizada), expande ela
    if (state === 'collapsed') {
      setOpen(true)
    }
  }

  const handleSubItemClick = (type: string, subType: string) => {
    // Efeito de click temporário
    setClickedItem(subType)
    setTimeout(() => setClickedItem(null), 200)

    // Se o subType já está ativo, limpa os filtros (toggle)
    if (activeSubType === subType) {
      onClearFilters?.()
    } else {
      // Caso contrário, aplica o filtro
      onSubItemClick?.(type, subType)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Categorias</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.title}
                  onClick={handleTypeClick}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => {
                    const isActiveSubType = activeSubType === subItem.title
                    const isClicked = clickedItem === subItem.title

                    return (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          onClick={() =>
                            handleSubItemClick(item.title, subItem.title)
                          }
                          className={`cursor-pointer transition-all duration-300 ease-in-out transform relative overflow-hidden ${
                            isActiveSubType
                              ? 'text-primary font-medium bg-primary/10 border-l-2 border-primary scale-105 shadow-sm hover:bg-red-50 hover:border-red-400 hover:text-red-600 animate-glow-pulse'
                              : 'hover:text-sidebar-foreground hover:bg-sidebar-accent/50 hover:translate-x-1 hover:scale-102'
                          } ${
                            isClicked
                              ? 'animate-click-bounce bg-primary/20'
                              : ''
                          }`}
                          title={
                            isActiveSubType
                              ? `Clique para remover o filtro "${subItem.title}"`
                              : `Filtrar por ${subItem.title}`
                          }
                        >
                          <span className="transition-transform duration-200 relative z-10 flex items-center justify-between w-full">
                            <span>{subItem.title}</span>
                            {isActiveSubType && (
                              <X className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                            )}
                          </span>
                          {/* Efeito ripple ao clicar */}
                          {isClicked && (
                            <div className="absolute inset-0 bg-primary/10 animate-ping rounded-md" />
                          )}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
