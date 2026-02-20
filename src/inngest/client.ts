
import { realtimeMiddleware } from "@inngest/realtime/middleware";
import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ 
    id: "nodebase",
    middleware:[realtimeMiddleware()],
 });