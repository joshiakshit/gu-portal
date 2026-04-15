import { LayoutDashboard, CalendarDays, BookOpen, RefreshCw } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useStatus, useRefresh } from "@/hooks/usePortalData";
import { useToast } from "@/hooks/use-toast";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Timetable", url: "/timetable", icon: CalendarDays },
  { title: "Attendance", url: "/attendance", icon: BookOpen },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { data: status } = useStatus();
  const { refreshAll } = useRefresh();
  const { toast } = useToast();
  const isScraping = status?.scraping ?? false;

  const handleRefreshAll = () => {
    refreshAll.mutate(undefined, {
      onSuccess: () => toast({ title: "All data refreshed" }),
      onError: (err: any) => toast({ title: "Refresh failed", description: err?.response?.data?.error || err.message, variant: "destructive" }),
    });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-highlight flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-highlight-light">GU</span>
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-semibold text-foreground">GU Portal</h2>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                Student Dashboard
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleRefreshAll}
                  disabled={refreshAll.isPending || isScraping}
                  tooltip="Refresh All Data"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshAll.isPending ? "animate-spin" : ""}`} />
                  {!collapsed && <span>Refresh All</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {/* Scraper status */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isScraping ? "bg-amber-500 animate-pulse-dot" : "bg-green-500"
            }`}
          />
          {!collapsed && (
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
              {isScraping ? "Scraping…" : "System ready"}
            </span>
          )}
        </div>

        <SidebarSeparator className="mb-3" />

        <div className="flex items-center justify-between">
          <ThemeToggle />
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-highlight flex items-center justify-center">
                <span className="text-[10px] font-medium text-highlight-light">GU</span>
              </div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
