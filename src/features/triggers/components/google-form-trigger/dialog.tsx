"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useParams } from "next/navigation";
import { Label } from "recharts";
import { toast } from "sonner";


interface Props{
    open : boolean;
    onOpenChange : (open: boolean) => void;
};

export const GoogleFormTriggerDialog = ({   
    open, 
    onOpenChange,
}: Props) => {

    const params = useParams();
    const workflowId = params.workflowId as string;


    //construct the webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const webhookUrl = `${baseUrl}/api/webhooks/google-form?workflowId=${workflowId}`;

    const copyToClipboard = async () => {
        try{
            await navigator.clipboard.writeText(webhookUrl);
            toast.success("Webhook URL copied to clipboard!");
        } catch (err) {
            toast.error("Failed to copy webhook URL. Please try copying manually.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>

            <DialogHeader>
                <DialogTitle>Google Form Trigger Configuration</DialogTitle>
                <DialogDescription>
                    Use this webhook URL in your Google Form's Apps Script to trigger this workflow when a form is submitted.
                </DialogDescription>
            </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="webhook-url">Webhook URL</Label>
                        <input
                            id="webhook-url"
                            type="text"
                            value={webhookUrl}
                            readOnly
                            className="w-full p-2 border rounded-md"
                        />
                    </div>
                    
                </div>
            </DialogContent>
        </Dialog>
    )
}