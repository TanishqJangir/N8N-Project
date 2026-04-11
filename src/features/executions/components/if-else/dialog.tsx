"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { IfElseOperator } from "./executor";

const OPERATORS: { value: IfElseOperator; label: string; hint: string }[] = [
    { value: "==",         label: "equals (==)",            hint: "True when left equals right" },
    { value: "!=",         label: "not equals (!=)",         hint: "True when left differs from right" },
    { value: ">",          label: "greater than (>)",        hint: "True when left > right (numeric or string)" },
    { value: "<",          label: "less than (<)",           hint: "True when left < right" },
    { value: ">=",         label: "greater or equal (>=)",   hint: "True when left >= right" },
    { value: "<=",         label: "less or equal (<=)",      hint: "True when left <= right" },
    { value: "contains",   label: "contains",                hint: "True when left contains right (case-insensitive)" },
    { value: "startsWith", label: "starts with",             hint: "True when left starts with right" },
    { value: "endsWith",   label: "ends with",               hint: "True when left ends with right" },
    { value: "isEmpty",    label: "is empty",                hint: "True when left value is blank" },
    { value: "isNotEmpty", label: "is not empty",            hint: "True when left value has content" },
];

const formSchema = z.object({
    variableName: z
        .string()
        .min(1, { message: "Variable name is required" })
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
            message: "Must start with a letter/underscore, only letters/numbers/underscores allowed",
        }),
    leftValue: z.string().min(1, "Left value is required"),
    operator: z.enum([
        "==", "!=", ">", "<", ">=", "<=",
        "contains", "startsWith", "endsWith",
        "isEmpty", "isNotEmpty",
    ] as [IfElseOperator, ...IfElseOperator[]]),
    rightValue: z.string().optional(),
});

export type IfElseFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: IfElseFormValues) => void;
    defaultValues?: Partial<IfElseFormValues>;
}

export const IfElseDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
}: Props) => {
    const form = useForm<IfElseFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            variableName: defaultValues.variableName ?? "",
            leftValue: defaultValues.leftValue ?? "",
            operator: defaultValues.operator ?? "==",
            rightValue: defaultValues.rightValue ?? "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                variableName: defaultValues.variableName ?? "",
                leftValue: defaultValues.leftValue ?? "",
                operator: defaultValues.operator ?? "==",
                rightValue: defaultValues.rightValue ?? "",
            });
        }
    }, [open, defaultValues, form]);

    const watchVariableName = form.watch("variableName") || "myCondition";
    const watchOperator = form.watch("operator");
    const noRightValue = watchOperator === "isEmpty" || watchOperator === "isNotEmpty";

    const selectedOpInfo = OPERATORS.find((o) => o.value === watchOperator);

    const handleSubmit = (values: IfElseFormValues) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>IF / ELSE Configuration</DialogTitle>
                    <DialogDescription>
                        Define a condition to split the workflow into two branches.
                        Use{" "}
                        <code className="text-xs bg-muted px-1 rounded">{"{{variable.field}}"}</code>{" "}
                        to reference values from previous nodes.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-4">

                        {/* Variable Name */}
                        <FormField
                            control={form.control}
                            name="variableName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Variable Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="myCondition" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Access the result as{" "}
                                        <code className="text-xs bg-muted px-1 rounded">{`{{${watchVariableName}.result}}`}</code>{" "}
                                        (boolean) or{" "}
                                        <code className="text-xs bg-muted px-1 rounded">{`{{${watchVariableName}.branch}}`}</code>{" "}
                                        ("true" / "false")
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Left Value */}
                        <FormField
                            control={form.control}
                            name="leftValue"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Left Value</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="{{myTrigger.score}} or 42"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        The value to check. Use{" "}
                                        <code className="text-xs bg-muted px-1 rounded">{"{{node.field}}"}</code>{" "}
                                        to pull from a previous node.
                                        Example: <code className="text-xs bg-muted px-1 rounded">{"{{myForm.score}}"}</code>
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Operator */}
                        <FormField
                            control={form.control}
                            name="operator"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Operator</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select operator" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {OPERATORS.map((op) => (
                                                <SelectItem key={op.value} value={op.value}>
                                                    {op.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedOpInfo && (
                                        <FormDescription>{selectedOpInfo.hint}</FormDescription>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Right Value (hidden for isEmpty/isNotEmpty) */}
                        {!noRightValue && (
                            <FormField
                                control={form.control}
                                name="rightValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Right Value</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="{{myTrigger.threshold}} or 100"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            The value to compare against. Can be a literal (e.g. <code className="text-xs bg-muted px-1 rounded">100</code>) or a reference (e.g.{" "}
                                            <code className="text-xs bg-muted px-1 rounded">{"{{myNode.limit}}"}</code>).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Branch hint */}
                        <div className="rounded-md border p-3 text-sm text-muted-foreground space-y-1 bg-muted/40">
                            <p className="font-medium text-foreground">How to connect branches:</p>
                            <p>🟢 <strong>True handle</strong> (top-right) → drag to nodes that run when condition is TRUE</p>
                            <p>🔴 <strong>False handle</strong> (bottom-right) → drag to nodes that run when condition is FALSE</p>
                        </div>

                        <DialogFooter className="mt-4">
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
