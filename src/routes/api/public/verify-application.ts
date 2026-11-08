import { createFileRoute } from "@tanstack/react-router";
import { handleVerification } from "@/lib/ai/verification.server";

export const Route = createFileRoute("/api/public/verify-application")({
  server: { handlers: { POST: ({ request }) => handleVerification(request) } },
});