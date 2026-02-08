import { SidebarTrigger } from "./ui/sidebar";

export const AppHeader = () => {

    return (
        <header className="flex h-14 shrink">
            <SidebarTrigger />
        </header>
    )
}