import { inngest } from "@/inngest/client";
import { createTRPCRouter, protectedProcedure } from "../init";
import prisma from "@/lib/db";

export const appRouter = createTRPCRouter({
    getWorkflows: protectedProcedure.query(({ctx}) => {
        return prisma.workFlow.findMany();
    }),
    createWorkflow: protectedProcedure.mutation( async () =>{

        await inngest.send({
            name : "test/hello.world",
            data : {
                email : "tanishqjangir@gmail.com"
            }
        })

        return {success : true, message : "Job queued"}
    })
});

export type AppRouter = typeof appRouter;