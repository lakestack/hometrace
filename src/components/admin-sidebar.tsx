'use client';

import {
  Building2,
  Calendar,
  Home,
  LogOut,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

// Define menu items for different roles
const adminMenuItems = [
  {
    title: 'Dashboard',
    url: '/admin/dashboard',
    icon: Home,
    roles: ['admin'],
  },
  {
    title: 'Properties',
    url: '/admin/properties',
    icon: Building2,
    roles: ['admin', 'agent'],
  },
  {
    title: 'Appointments',
    url: '/admin/appointments',
    icon: Calendar,
    roles: ['admin', 'agent'],
  },
  {
    title: 'Users',
    url: '/admin/users',
    icon: Users,
    roles: ['admin'], // Only admin can see users
  },
  {
    title: 'Settings',
    url: '/admin/settings',
    icon: Settings,
    roles: ['admin'], // Only admin can see settings
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Filter menu items based on user role
  const userRole = session?.user?.role || 'agent';
  const filteredMenuItems = adminMenuItems.filter((item) =>
    item.roles.includes(userRole),
  );

  const handleLogout = () => {
    // Implement logout logic
    document.cookie =
      'admin-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/auth/login';
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <Building2 className="h-6 w-6" />
          <span className="font-semibold">Hometrace</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
