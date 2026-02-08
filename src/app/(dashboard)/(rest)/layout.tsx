import { AppHeader } from "@/components/app-header";

const Layout = ({ children }: { children: React.ReactNode }) => {

    return (
        <>
        <AppHeader />
            <main className="flex-1 shrink-0 items-center gap-2 border-b px-4 bg-background">
                {children}
            </main>
        </>
    )
}
export default Layout;