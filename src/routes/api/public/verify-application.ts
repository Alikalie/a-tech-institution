import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/verify-application")({
  server: { handlers: { POST: async ({ request }) => {
    const { handleVerification } = await import("@/lib/ai/verification.server");
    return handleVerification(request);
  } } },
});