import { createFileRoute } from "@tanstack/react-router";
import { GrokBotApp } from "@/components/grokbot/app";

export const Route = createFileRoute("/")({
  component: GrokBotApp,
});
