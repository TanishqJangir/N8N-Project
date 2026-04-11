import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { ifElseChannel } from "@/inngest/channels/if-else";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context));
});

export type IfElseOperator =
  | "==" | "!=" | ">" | "<" | ">=" | "<="
  | "contains" | "startsWith" | "endsWith"
  | "isEmpty" | "isNotEmpty";

type IfElseData = {
  variableName?: string;
  leftValue?: string;
  operator?: IfElseOperator;
  rightValue?: string;
};

/**
 * Evaluates the condition.
 * Both leftValue and rightValue are resolved via Handlebars first,
 * so you can use {{previousNode.field}} to pull values from context.
 */
function evaluate(
  left: string,
  operator: IfElseOperator,
  right: string
): boolean {
  // Attempt numeric comparison if both sides look numeric
  const leftNum = Number(left);
  const rightNum = Number(right);
  const bothNumeric = !isNaN(leftNum) && !isNaN(rightNum);

  switch (operator) {
    case "==":
      return bothNumeric ? leftNum === rightNum : left === right;
    case "!=":
      return bothNumeric ? leftNum !== rightNum : left !== right;
    case ">":
      return bothNumeric ? leftNum > rightNum : left > right;
    case "<":
      return bothNumeric ? leftNum < rightNum : left < right;
    case ">=":
      return bothNumeric ? leftNum >= rightNum : left >= right;
    case "<=":
      return bothNumeric ? leftNum <= rightNum : left <= right;
    case "contains":
      return left.toLowerCase().includes(right.toLowerCase());
    case "startsWith":
      return left.toLowerCase().startsWith(right.toLowerCase());
    case "endsWith":
      return left.toLowerCase().endsWith(right.toLowerCase());
    case "isEmpty":
      return left.trim() === "";
    case "isNotEmpty":
      return left.trim() !== "";
    default:
      return false;
  }
}

export const ifElseExecutor: NodeExecutor<IfElseData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(ifElseChannel().status({ nodeId, status: "loading" }));

  if (!data.operator) {
    await publish(ifElseChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("IF/ELSE Node: Operator is not configured");
  }

  try {
    const result = await step.run("evaluate-condition", async () => {
      // Resolve Handlebars templates so {{previousNode.field}} works
      const leftRaw = Handlebars.compile(data.leftValue ?? "")(context);
      const rightRaw = Handlebars.compile(data.rightValue ?? "")(context);

      const left = decode(leftRaw).trim();
      const right = decode(rightRaw).trim();

      const conditionResult = evaluate(left, data.operator!, right);
      const branch: "true" | "false" = conditionResult ? "true" : "false";

      return {
        ...context,
        // Internal marker used by functions.ts to route branches
        __ifResult__: {
          nodeId,
          branch,
          left,
          operator: data.operator,
          right,
          result: conditionResult,
        },
        // Also expose the result under the user-defined variable name
        [data.variableName || "myCondition"]: {
          result: conditionResult,
          branch,
          evaluated: `${left} ${data.operator} ${right}`,
        },
      };
    });

    const branch = (result.__ifResult__ as { branch: "true" | "false" }).branch;
    await publish(ifElseChannel().status({ nodeId, status: "success", branch }));

    return result;
  } catch (error) {
    await publish(ifElseChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
