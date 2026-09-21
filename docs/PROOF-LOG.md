# Isolated proof log

Run date: 2026-09-21

Environment: an unpublished n8n copy named **Proof: Quote chaser duplicate + provider failure - 2026-09-21**. The retained source workflow was not changed.

## Safety controls

- Synthetic quote and customer identity only.
- Reserved `+1555...` sender, owner, and customer numbers.
- All three waits set to zero in the proof copy.
- No real customer or owner destination.
- No SMS reached a handset.

## Full execution 380

- Submitted one valid synthetic webhook payload.
- `Quote sent`, `Your settings`, `Prepare the chase`, `Answer the webhook`, and `Usable phone?` succeeded.
- `Tell the owner` attempted the first Twilio send and failed in 2.141 seconds.
- Twilio reported an invalid `To` phone number for the reserved destination.
- No wait, reply check, customer nudge, retry, or alternate owner alert ran afterward.

## Full execution 381

- Submitted the exact same synthetic payload again.
- n8n accepted it as a new execution rather than recognizing a duplicate.
- The same five upstream nodes succeeded.
- `Tell the owner` failed again on the same reserved destination in 2.08 seconds.
- No downstream node ran.

Together these executions prove that an identical trigger starts another cadence and that an initial Twilio failure terminates the execution without retry or alternate notification.

Execution 379 was a trigger-node-only listener check used while preparing the full test. It is retained in n8n but is not cited as full-workflow evidence.
