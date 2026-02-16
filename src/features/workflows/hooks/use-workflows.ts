// Hook to fetch all workflows useing suspense
import { useTRPC } from "@/trpc/client"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkflowsParams } from "./use-workflows-params";

export const useSuspenseWorkflows = () => {
    const trpc = useTRPC();
    const [params] = useWorkflowsParams();

    return useSuspenseQuery(trpc.workflows.getMany.queryOptions(params));
}


// Hook to create a new workflow


export const useCreateWorkflow = () => {
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    return useMutation(
        trpc.workflows.create.mutationOptions({
            onSuccess: (data) => {
                toast.success(`Workflow ${data.name} created`);
                queryClient.invalidateQueries(
                    trpc.workflows.getMany.queryOptions({}),
                );
            },
            onError: (error) => {
                toast.error(`Failed to create the workflow : ${error.message}`)
            }
        }),
    );

}

// Hook to remove the workflow

export const useRemoveWorkflow = () => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();


    return useMutation(
        trpc.workflows.remove.mutationOptions({
            onSuccess: (data) => {
                toast.success(`Workflow "${data.name}" removed.`);
                queryClient.invalidateQueries(trpc.workflows.getMany.queryOptions({}));
                queryClient.invalidateQueries(
                    trpc.workflows.getOne.queryFilter({ id: data.id })
                );
            },
            onError: (error) => {
                toast.error(`Failed to remove the workflow: ${error.message}`);
            }
        })
    )
}


export const useSuspenseWorkflow = (id: string) => {
    const trpc = useTRPC();
    return useSuspenseQuery(trpc.workflows.getOne.queryOptions({ id }))
}


//Hook to update a workflow name
export const useUpdateWorkflowName = () => {
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    return useMutation(
        trpc.workflows.updateName.mutationOptions({
            onSuccess: (data) => {
                toast.success(`Workflow ${data.name} updated`);
                queryClient.invalidateQueries(
                    trpc.workflows.getMany.queryOptions({}),
                );
                queryClient.invalidateQueries(
                    trpc.workflows.getOne.queryOptions({ id: data.id }),
                )
            },
            onError: (error) => {
                toast.error(`Failed to update the workflow : ${error.message}`)
            }
        }),
    );
};



//Hook to update a workflow
export const useUpdateWorkflow = () => {
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    return useMutation(
        trpc.workflows.update.mutationOptions({
            onSuccess: (data) => {
                toast.success(`Workflow ${data.name} saved`);
                queryClient.invalidateQueries(
                    trpc.workflows.getMany.queryOptions({}),
                );
                queryClient.invalidateQueries(
                    trpc.workflows.getOne.queryOptions({ id: data.id }),
                )
            },
            onError: (error) => {
                toast.error(`Failed to save the workflow : ${error.message}`)
            }
        }),
    );
};