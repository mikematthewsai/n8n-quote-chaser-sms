# Implementation decisions

## Check immediately before each send

The workflow queries Twilio after every wait instead of deciding the whole cadence once at intake. A reply can therefore stop later nudges without needing an AI classifier.

## Treat any SMS reply as a handoff

This version does not guess intent. Any inbound SMS after `started_at` stops the chase and alerts the owner. That is conservative and easy to explain, but it cannot distinguish acceptance, rejection, delay, or opt-out.

## Return the plan before the cadence finishes

The webhook responds with the normalized input and planned timestamps before the Wait nodes complete. The caller receives a fast acknowledgement while n8n retains the long-running execution.

## Keep configuration in one node

Business identity, phone numbers, time zone, waits, and message templates live in **Your settings** so an importer does not have to edit many branches.

## Preserve known weaknesses in the release

The sanitized package matches the tested 26-node source apart from removed credential references. It does not silently add unproven idempotency, retries, or CRM state. Those are the next production-hardening decisions, not claims attached to this evidence.
