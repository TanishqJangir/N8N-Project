
import { requireAuth } from "@/lib/auth-utils";
import { caller } from "@/trpc/server";
import  LogoutButton  from "./logout";

const Page = async () => {
  await requireAuth();


  const data = await caller.getUsers();

  return <div className="flex justify-center items-center min-h-screen min-w-screen flex-col gap-y-6">
    Protected Server Component
    <div>
    {JSON.stringify(data, null, 2)}
    </div>

  <LogoutButton />
  </div>
}

export default Page;