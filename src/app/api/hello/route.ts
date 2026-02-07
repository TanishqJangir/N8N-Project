import { NextResponse } from "next/server";
import { inngest } from "../../../inngest/client"; // Import our client

// Opt out of caching; every request should send a new event
export const dynamic = "force-dynamic";

/**
 * Handle GET requests by sending a test event to Inngest and returning a confirmation JSON response.
 *
 * @returns A JSON HTTP response containing `{ message: "Event sent!" }`
 */
export async function GET() {
  // Send your event payload to Inngest
  await inngest.send({
    name: "test/hello.world",
    data: {
      email: "testUser@example.com",
    },
  });

  return NextResponse.json({ message: "Event sent!" });
}