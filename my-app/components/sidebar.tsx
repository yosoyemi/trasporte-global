// components/sidebar.tsx
// Server wrapper para importar el componente cliente en RSC sin pasar props
import SidebarClient from "./sidebar-client"

export default function Sidebar() {
  return <SidebarClient />
}
