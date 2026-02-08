import { requireAuth } from "@/lib/auth-utils";

const Page = async () => {
    await requireAuth();
    return <div>
        Credentials page
    </div>
}


export default Page;