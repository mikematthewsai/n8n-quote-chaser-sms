# Quote-chaser release status

Status: **release package complete; core live paths, provider failure, duplicate behavior, and 18 local cases proven**

Updated: 2026-09-21

## Source boundary

The private source export is:

`C:/Builder-OS-starter/repos/n8n-templates/quote-chaser-sms-twilio.json`

It remains read-only. It contains nine Twilio credential references and must not be published directly. The release `workflow.json` removes those credential objects and otherwise preserves the tested 26-node workflow structure and parameters.

The older `n8n-publish/09-quote-chaser.json` is a different 28-node system workflow that depends on data tables and other internal workflows. It was not used as the public artifact.

## Retained live evidence

- **Execution 337 — full no-reply cadence:** succeeded in approximately 8 minutes 41 seconds. The start alert, three wait/check/nudge rounds, all three nudges, and the final owner-closure path ran.
- **Execution 338 — reply stop:** succeeded in approximately 5 minutes 48 seconds. The start alert and nudge one ran; the second reply check found a customer response; the workflow skipped nudges two and three and notified the owner.
- **Execution 340 — invalid phone:** succeeded in approximately 1.9 seconds. The planner produced `ok: false`; the false branch ended before the owner start alert, waits, reply queries, or customer nudges.

These are retained n8n executions, not reconstructed claims. The source workflow remains unpublished.

## Local verification

The public test harness loads the actual `Prepare the chase` program from `workflow.json`. It supplies a deterministic UTC DateTime adapter and checks 18 cases:

- US and longer international number normalization;
- invalid phone and missing sender/owner configuration;
- default cumulative waits;
- zero and fractional waits for accelerated testing;
- amount and message-token formatting;
- empty-name fallback;
- replies before and after `started_at`;
- empty Twilio results;
- the previous-day query boundary;
- exact duplicate input being independently accepted.

The adapter verifies planning deterministically, not Luxon's IANA or daylight-saving implementation.

## Isolated failure and duplicate proof

- **Execution 380:** the valid synthetic payload passed intake and validation, then the reserved owner destination caused `Tell the owner` to fail. The execution stopped before any wait or customer nudge; no retry or alternate alert ran.
- **Execution 381:** the exact same synthetic payload was submitted again and accepted as a separate execution. It followed the same path and failed independently at `Tell the owner`.
- Both executions used only reserved `+1555...` numbers in an unpublished proof copy. No real SMS was delivered.
- Execution 379 was a trigger-node-only listener check and is not counted as full-workflow evidence.

See [PROOF-LOG.md](PROOF-LOG.md) for the precise test boundary.

## Publish gate

The package is ready for a publish/no-publish decision. Do not claim retry safety, idempotency, or CRM terminal-state handling. The defensible claim is narrower: the workflow checks Twilio before each nudge, stops on a detected SMS reply, completes the no-reply cadence, rejects an unusable phone before sending, accepts duplicate triggers independently, and stops at an unrecovered provider error.
