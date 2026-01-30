"use client"

import { useTRPC } from "@/trpc/client"
import { useSuspenseQuery } from "@tanstack/react-query";

export const Client = () => {
    const trpc = useTRPC();
    const { data: users } = useSuspenseQuery(trpc.getUsers.queryOptions());

    return <div className="flex justify-center items-center min-h-screen min-w-screen">
        Client component : {JSON.stringify(users)}
    </div>
}
