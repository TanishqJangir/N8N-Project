import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { topologicalSort } from "./utils";
import { ExecutionStatus, NodeType, type Connection, type Node } from "@/generated/prisma";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { httpRequestChannel } from "./channels/http-request";
import { manualTriggerChannel } from "./channels/manual_trigger";
import { googleFormTriggerChannel } from "./channels/google-form-trigger";
import { stripeTriggerChannel } from "./channels/stripe-trigger";
import { geminiChannel } from "./channels/gemini";
import { openAiChannel } from "./channels/openai";
import { anthropicChannel } from "./channels/anthropic";
import { discordChannel } from "./channels/discord";
import { slackChannel } from "./channels/slack";
import { googleSheetsChannel } from "./channels/google-sheets";
import { gmailChannel } from "./channels/gmail";
import { ifElseChannel } from "./channels/if-else";


/**
 * Given an IF/ELSE nodeId and the branch that was NOT taken (skippedBranch),
 * mark all nodes reachable via that branch as skipped.
 *
 * Strategy:
 * 1. Find all direct children connected via `fromOutput === skippedBranch`.
 * 2. BFS from those children (following any fromOutput — "main", "true", "false")
 *    to mark their entire downstream subgraph as skipped.
 *
 * A node is only marked skipped if it is NOT reachable via the TAKEN branch.
 */
function markDownstreamSkipped(
  ifNodeId: string,
  skippedBranch: "true" | "false",
  connections: { fromNodeId: string; fromOutput: string; toNodeId: string }[],
  skippedNodes: Set<string>,
): void {
  // Build adjacency: nodeId → children ids (via any output)
  const adjacency = new Map<string, string[]>();
  for (const conn of connections) {
    if (!adjacency.has(conn.fromNodeId)) adjacency.set(conn.fromNodeId, []);
    adjacency.get(conn.fromNodeId)!.push(conn.toNodeId);
  }

  // Seed: direct children of the IF node via the skipped branch only
  const seeds = connections
    .filter((c) => c.fromNodeId === ifNodeId && c.fromOutput === skippedBranch)
    .map((c) => c.toNodeId);

  if (seeds.length === 0) return;

  // BFS from seeds
  const queue = [...seeds];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (skippedNodes.has(nodeId)) continue;
    skippedNodes.add(nodeId);
    const children = adjacency.get(nodeId) ?? [];
    for (const child of children) {
      if (!skippedNodes.has(child)) {
        queue.push(child);
      }
    }
  }
}


export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    retries: process.env.NODE_ENV === "production" ? 3 : 0,
    onFailure: async ({ event, step }) => {
      return prisma.execution.update({
        where: {
          inngestEventId: event.data.event.id,
        },
        data: {
          status: ExecutionStatus.FAILED,
          error: event.data.error.message,
          errorStack: event.data.error.stack,
        },
      });
    },
  },
  {
    event: "workflows/execute.workflow",
    channels: [
      httpRequestChannel(),
      manualTriggerChannel(),
      googleFormTriggerChannel(),
      stripeTriggerChannel(),
      geminiChannel(),
      openAiChannel(),
      anthropicChannel(),
      discordChannel(),
      slackChannel(),
      googleSheetsChannel(),
      gmailChannel(),
      ifElseChannel(),
    ]
  },
  async ({ event, step, publish }) => {

    const inngestEventId = event.id;

    const workflowId = event.data.workflowId;

    if (!inngestEventId || !workflowId) {
      throw new NonRetriableError("Event Id or Workflow ID is missing");
    }

    await step.run("create-execution", async () => {
      return prisma.execution.create({
        data: {
          workflowId,
          inngestEventId,
        }
      })
    })

    // Fetch workflow with connections for branch resolution
    const { sortedNodes, connections } = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: {
          nodes: true,
          connections: true,
        },
      });

      return {
        sortedNodes: topologicalSort(workflow.nodes, workflow.connections),
        connections: workflow.connections,
      };
    });


    const userId = await step.run("find-user-id", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        select : {
          userId: true,
        }
      });

      return workflow.userId;
    });


    //Initialize the context with any initial data from the trigger
    let context = event.data.initialData || {};

    // Track nodes that belong to the non-taken branch of any IF/ELSE
    const skippedNodes = new Set<string>();

    //Execute each node in topological order
    for (const node of sortedNodes) {
      // Skip nodes on the non-taken side of a branch
      if (skippedNodes.has(node.id)) {
        continue;
      }

      const executor = getExecutor(node.type as NodeType);

      context = await executor({
        data: node.data as Record<string, unknown>,
        nodeId: node.id,
        userId,
        context,
        step,
        publish,
      });

      // After an IF/ELSE node runs, determine which branch to skip
      if (node.type === NodeType.IF_ELSE) {
        const ifResult = context.__ifResult__ as
          | { nodeId: string; branch: "true" | "false" }
          | undefined;

        if (ifResult && ifResult.nodeId === node.id) {
          const skippedBranch = ifResult.branch === "true" ? "false" : "true";
          markDownstreamSkipped(node.id, skippedBranch, connections, skippedNodes);
        }
      }
    }

    await step.run("update-execution", async () => {
      return prisma.execution.update({
        where: {
          inngestEventId,
          workflowId,
        },
        data:{
          status: ExecutionStatus.SUCCESS,
          completedAt: new Date(),
          output: context,
        },
      });
    });

    return {
      workflowId,
      result: context,
    };
  }
)