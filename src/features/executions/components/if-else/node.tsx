"use client";

import { Node, NodeProps, Position, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { IfElseDialog, IfElseFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchIfElseRealtimeToken } from "./actions";
import { IF_ELSE_CHANNEL_NAME } from "@/inngest/channels/if-else";
import { WorkflowNode } from "@/components/workflow-node";
import { BaseNode, BaseNodeContent } from "@/components/react-flow/base-node";
import { BaseHandle } from "@/components/react-flow/base-handle";
import { NodeStatusIndicator } from "@/components/react-flow/node-status-indicator";
import { GitBranchIcon } from "lucide-react";

type IfElseNodeData = {
    variableName?: string;
    leftValue?: string;
    operator?: IfElseFormValues["operator"];
    rightValue?: string;
};

type IfElseNodeType = Node<IfElseNodeData>;

export const IfElseNode = memo((props: NodeProps<IfElseNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes, setEdges } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: IF_ELSE_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchIfElseRealtimeToken,
    });

    const handleOpenSettings = () => setDialogOpen(true);

    const handleSubmit = (values: IfElseFormValues) => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === props.id) {
                    return { ...node, data: { ...node.data, ...values } };
                }
                return node;
            })
        );
    };

    const handleDelete = () => {
        setNodes((nodes) => nodes.filter((n) => n.id !== props.id));
        setEdges((edges) =>
            edges.filter((e) => e.source !== props.id && e.target !== props.id)
        );
    };

    const nodeData = props.data;
    const description = nodeData?.leftValue && nodeData?.operator
        ? `${nodeData.leftValue} ${nodeData.operator} ${nodeData.rightValue ?? ""}`.trim()
        : "Not configured";

    return (
        <>
            <IfElseDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
            />

            <WorkflowNode
                name="IF / ELSE"
                description={description}
                onDelete={handleDelete}
                onSettings={handleOpenSettings}
            >
                <NodeStatusIndicator status={nodeStatus} variant="border">
                    <BaseNode status={nodeStatus} onDoubleClick={handleOpenSettings}>
                        <BaseNodeContent>
                            <GitBranchIcon className="size-4 text-muted-foreground" />

                            <BaseHandle
                                id="target-1"
                                type="target"
                                position={Position.Left}
                            />

                            <BaseHandle
                                id="true"
                                type="source"
                                position={Position.Right}
                                className="!bg-green-500 !border-green-600 z-10"
                                style={{ top: "30%" }}
                                title="TRUE"
                            />

                            <BaseHandle
                                id="false"
                                type="source"
                                position={Position.Right}
                                className="!bg-red-500 !border-red-600 z-10"
                                style={{ top: "70%" }}
                                title="FALSE"
                            />
                        </BaseNodeContent>
                    </BaseNode>
                </NodeStatusIndicator>
            </WorkflowNode>
        </>
    );
});

IfElseNode.displayName = "IfElseNode";
