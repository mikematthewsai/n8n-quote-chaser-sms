# Public-template gap check

Checked: 2026-09-21

A focused search of the official n8n workflow library did not surface a standalone, quote-specific SMS chaser that checks for an inbound reply before every nudge. This is a scoped finding, not a claim that no comparable community workflow exists anywhere.

The closest official-library examples found were broader lead or appointment systems:

- [Send appointment SMS follow-ups with Typeform, Twilio, and Google Sheets](https://n8n.io/workflows/15000-send-appointment-sms-follow-ups-with-typeform-twilio-and-google-sheets/) uses a separate inbound handler, Google Sheets state, and a scheduled nudge engine.
- [Automated lead follow-up with Follow Up Boss, Gmail, Twilio & WhatsApp](https://n8n.io/workflows/9738-automated-lead-follow-up-with-follow-up-boss-gmail-twilio-and-whatsapp-messaging/) is a multi-channel CRM workflow rather than a small quote-specific drop.
- [Handling appointment leads and follow-up with Twilio, Cal.com and AI](https://n8n.io/workflows/2342-handling-appointment-leads-and-follow-up-with-twilio-calcom-and-ai/) depends on Airtable, Cal.com, and an AI agent.
- [Nurture leads from Google Sheets with Gmail, SMS, and OpenRouter AI](https://n8n.io/workflows/16721-nurture-leads-from-google-sheets-with-gmail-sms-and-openrouter-ai/) is one component of a four-workflow system and uses Sheets plus an AI provider.

## What this package contributes

This workflow is deliberately narrower:

- one importable workflow;
- one webhook contract;
- Twilio as the only external service;
- no CRM, spreadsheet, AI model, or companion workflow required;
- a Twilio history check immediately before every nudge;
- explicit owner handoff when a reply is found;
- retained evidence for the full cadence, reply-stop path, and invalid input;
- a public deterministic test harness and unusually direct limitations.

The tradeoff is equally important: this smaller design has no durable idempotency record, no cross-channel terminal-state source, and no recovery path for provider failures. Those omissions are disclosed rather than presented as solved.
