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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
    gmailUser: z.string().email("Invalid email address"),
    gmailAppPassword: z.string().min(1, "App Password is required"),
    variableName: z
        .string()
        .min(1, { message: "Variable name is required" })
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
            message: "Must start with a letter/underscore, only letters/numbers/underscores allowed",
        }),
    to: z.string().min(1, "Recipient email is required"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Email body is required"),
});

export type GmailFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: GmailFormValues) => void;
    defaultValues?: Partial<GmailFormValues>;
}

export const GmailDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
}: Props) => {
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<GmailFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            gmailUser: defaultValues.gmailUser ?? "",
            gmailAppPassword: defaultValues.gmailAppPassword ?? "",
            variableName: defaultValues.variableName ?? "",
            to: defaultValues.to ?? "",
            subject: defaultValues.subject ?? "",
            body: defaultValues.body ?? "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                gmailUser: defaultValues.gmailUser ?? "",
                gmailAppPassword: defaultValues.gmailAppPassword ?? "",
                variableName: defaultValues.variableName ?? "",
                to: defaultValues.to ?? "",
                subject: defaultValues.subject ?? "",
                body: defaultValues.body ?? "",
            });
        }
    }, [open, defaultValues, form]);

    const watchVariableName = form.watch("variableName") || "myGmail";

    const handleSubmit = (values: GmailFormValues) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Gmail Configuration</DialogTitle>
                    <DialogDescription>
                        Configure this node to send an email via Gmail. Use{" "}
                        <code className="text-xs bg-muted px-1 rounded">{"{{variable.field}}"}</code>{" "}
                        to pull values from previous nodes.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-4">

                        {/* Gmail User */}
                        <FormField
                            control={form.control}
                            name="gmailUser"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Gmail Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="your_email_address@gmail.com" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        The Gmail account you are sending from.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* App Password */}
                        <FormField
                            control={form.control}
                            name="gmailAppPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>App Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="16-character app password"
                                                {...field}
                                                onChange={(e) => {
                                                    const noSpaces = e.target.value.replace(/\s+/g, "");
                                                    field.onChange(noSpaces);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        <details>
                                            <summary className="cursor-pointer text-blue-500 hover:underline">
                                                How to get an App Password? (Requires 2FA)
                                            </summary>
                                            <ol className="list-decimal list-inside mt-2 space-y-1 text-xs px-2">
                                                <li>Go to your Google Account Settings</li>
                                                <li>Navigate to the "Security" tab</li>
                                                <li>Ensure "2-Step Verification" is turned ON</li>
                                                <li>Search for "App Passwords" in the top search bar</li>
                                                <li>Create a new app password (e.g., name it "Nodebase")</li>
                                                <li>Copy the generated 16-character password and paste it here</li>
                                            </ol>
                                        </details>
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Variable Name */}
                        <FormField
                            control={form.control}
                            name="variableName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Variable Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="myGmail" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Reference this node's result in later nodes as{" "}
                                        <code className="text-xs bg-muted px-1 rounded">{`{{${watchVariableName}.messageId}}`}</code>
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* To */}
                        <FormField
                            control={form.control}
                            name="to"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>To (Recipient)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="recipient@example.com or {{myTrigger.email}}"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Static email or dynamic value from a previous node, e.g.{" "}
                                        <code className="text-xs bg-muted px-1 rounded">{"{{myForm.email}}"}</code>
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Subject */}
                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subject</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Hello from {{myTrigger.name}}!"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Supports Handlebars: <code className="text-xs bg-muted px-1 rounded">{"{{variable.field}}"}</code>
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Body */}
                        <FormField
                            control={form.control}
                            name="body"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Body</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={"Hi {{myTrigger.name}},\n\nHere is your summary:\n{{myGemini.text}}"}
                                            className="min-h-[120px] font-mono text-sm"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Plain text or HTML. Supports{" "}
                                        <code className="text-xs bg-muted px-1 rounded">{"{{variable}}"}</code>{" "}
                                        and{" "}
                                        <code className="text-xs bg-muted px-1 rounded">{"{{json variable}}"}</code>{" "}
                                        for objects.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="mt-4">
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
