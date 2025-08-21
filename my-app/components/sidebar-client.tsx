// components/sidebar-client.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  LayoutDashboard,
  Truck,
  Wrench,
  ClipboardList,
  Fuel,
  FileText,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image" // 👈 Importamos Image de Next.js

const navigationItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "Unidades", icon: Truck, href: "/units", badge: "23" },
  { title: "Mantenimientos", icon: Wrench, href: "/maintenance", badge: "7" },
  { title: "Servicios", icon: ClipboardList, href: "/services" },
  { title: "Combustible", icon: Fuel, href: "/fuel" },
  { title: "Reportes", icon: FileText, href: "/reports" },
  { title: "Anomalías", icon: AlertTriangle, href: "/anomalies", badge: "5" },
]

export default function SidebarClient() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 shadow-sm",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border bg-sidebar">
        {!collapsed && (
          <div className="flex items-center gap-2">
            {/* 👇 Logo en lugar de texto */}
            <Image
              src="/cemex-1.svg"
              alt="Logo"
              width={120}   // ajusta según el tamaño que quieras
              height={40}
              priority
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          {!collapsed && <ThemeToggle />}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0 hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2">
        {navigationItems.map((item, index) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link key={index} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11 text-sm font-medium transition-all duration-200",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.title}</span>
                    {item.badge && (
                      <Badge
                        variant={isActive ? "secondary" : "outline"}
                        className={cn(
                          "ml-auto text-xs font-semibold",
                          isActive ? "bg-primary-foreground/20 text-primary-foreground" : "",
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Footer */}
      <div className="p-3">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-11 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200",
            collapsed && "justify-center px-2",
          )}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Configuración</span>}
        </Button>
      </div>
    </div>
  )
}
