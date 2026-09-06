import { Link, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { NAV_ITEMS } from './navItems'
import { useAuth } from '../../hooks/useAuth'
import { useProjects } from '../../hooks/useProjectsData'
import { UserMenu } from './UserMenu'
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../animate-ui/components/radix/sidebar'

function isNavItemActive(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function Sidebar() {
  const { userProfile, currentUser } = useAuth()
  const { data: projects = [] } = useProjects()
  const { pathname } = useLocation()
  const topProjects = projects.slice(0, 4)

  return (
    <SidebarRoot collapsible="offcanvas" className="border-none bg-navy text-white [&_[data-slot=sidebar-inner]]:bg-navy">
      <SidebarHeader className="px-8 pt-8 pb-2">
        <p className="text-2xl font-medium text-white">flowvantage</p>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-[14px]">
        <SidebarGroup className="p-0">
          <SidebarMenu className="gap-1.5">
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  asChild
                  isActive={isNavItemActive(pathname, item.to, item.end)}
                  className="h-auto rounded-[10px] px-3 py-2.5 text-[15px] font-medium text-[#9896a3] hover:bg-rail-hover hover:text-white data-[active=true]:bg-primary data-[active=true]:font-medium data-[active=true]:text-white"
                >
                  <Link to={item.to}>
                    <item.icon size={19} strokeWidth={1.9} />
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-6 border-t border-[#333c4e] px-[8px] pt-4">
          <SidebarGroupLabel className="h-auto justify-between px-0 pb-2 text-xs font-medium tracking-wide text-[#d3d2dc] uppercase">
            Projects
            <Plus size={14} className="text-[#d3d2dc]" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2.5">
              {topProjects.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton
                    asChild
                    className="h-auto rounded-lg px-0 py-0 text-sm text-[#888793] hover:bg-transparent hover:text-white"
                  >
                    <Link to={`/dashboard/projects/${project.id}`}>
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: project.color }}
                        aria-hidden
                      />
                      <span className="truncate">{project.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mx-[3px] mb-6 p-0">
        <div className="flex items-center gap-2.5 rounded-[10px] border border-white/10 bg-white/5 p-2">
          <UserMenu />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {userProfile?.name ?? currentUser?.displayName ?? 'Account'}
            </p>
            <p className="truncate text-xs text-[#a0a0a3]">Free Account</p>
          </div>
        </div>
      </SidebarFooter>
    </SidebarRoot>
  )
}
