import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import nodemailer from "nodemailer";
import type { NodeExecutor } from "@/features/executions/types";
import { gmailChannel } from "@/inngest/channels/gmail";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context));
});

type GmailData = {
  gmailUser?: string;
  gmailAppPassword?: string;
  variableName?: string;
  to?: string;
  subject?: string;
  body?: string;
};

/**
 * Creates a Nodemailer Gmail SMTP transport.
 * Works identically in development and production.
 * Requires user and pass from the node configuration.
 */
function createGmailTransport(user: string, pass: string) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user,
      pass: pass,
    },
  });
}

export const gmailExecutor: NodeExecutor<GmailData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    gmailChannel().status({ nodeId, status: "loading" })
  );

  // Validate required config
  if (!data.to) {
    await publish(gmailChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Gmail Node: Recipient email (To) is missing");
  }
  if (!data.subject) {
    await publish(gmailChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Gmail Node: Subject is missing");
  }
  if (!data.body) {
    await publish(gmailChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Gmail Node: Email body is missing");
  }
  if (!data.gmailUser || !data.gmailAppPassword) {
    await publish(gmailChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "Gmail Node: Gmail User or App Password is not provided in the node settings"
    );
  }

  try {
    // Resolve Handlebars templates against workflow context (dynamic values from previous nodes)
    const to = decode(Handlebars.compile(data.to)(context));
    const subject = decode(Handlebars.compile(data.subject)(context));
    const body = decode(Handlebars.compile(data.body)(context));

    const result = await step.run("send-gmail", async () => {
      const transporter = createGmailTransport(data.gmailUser!, data.gmailAppPassword!);

      const info = await transporter.sendMail({
        from: `"Nodebase Workflow" <${data.gmailUser}>`,
        to,
        subject,
        // Support both plain text (default) and HTML (if body contains HTML tags)
        ...(/<[a-z][\s\S]*>/i.test(body)
          ? { html: body, text: body.replace(/<[^>]+>/g, "") }
          : { text: body }),
      });

      return {
        ...context,
        [data.variableName || "myGmail"]: {
          messageId: info.messageId,
          to,
          subject,
          accepted: info.accepted,
          rejected: info.rejected,
        },
      };
    });

    await publish(gmailChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    await publish(gmailChannel().status({ nodeId, status: "error" }));
    throw error instanceof NonRetriableError
      ? error
      : new Error(
          `Gmail Node: Failed to send email — ${error instanceof Error ? error.message : String(error)}`
        );
  }
};
