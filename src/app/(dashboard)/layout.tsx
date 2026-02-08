import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

const Layout = ({children} : {children : React.ReactNode}) => {

    return (
        <SidebarProvider>
            <AppSidebar/>
            <SidebarInset className="bg-accent">
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}
export default Layout;