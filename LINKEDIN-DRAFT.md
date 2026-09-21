# LinkedIn workflow drop draft

The dangerous quote follow-up is not the one that forgets to send.

It is the one that keeps texting after the customer replied.

I built a small n8n quote chaser that receives a quote, schedules up to three SMS nudges, and checks the Twilio conversation again before every send. If the customer has replied since that quote chase began, the workflow stops and hands the conversation back to the owner.

The live tests covered three useful paths: a full no-reply cadence, a reply after the first nudge that stopped the remaining messages, and an invalid phone that never entered the cadence.

The local planning suite adds 18 deterministic checks around phone normalization, timing, message templates, reply timestamps, and duplicate input. Two isolated full-workflow runs then showed that replaying the identical quote starts a second execution, and that a Twilio rejection stops the workflow without a retry or alternate alert.

That last test exposes the biggest limitation: replaying the same quote starts another cadence. This standalone version has no idempotency key. It also treats every SMS response as “stop and let a human handle it” rather than trying to guess whether the customer accepted, declined, delayed, or opted out.

I am publishing the sanitized workflow, setup guide, sample webhook, diagram, test harness, proof log, and limitations for free.

If you automate quote follow-up, what event is authoritative enough to stop the sequence?

## Recommended publication

- **Date:** Tuesday, October 6, 2026, at 9:00 AM Eastern, assuming the appointment-reminder post remains scheduled for September 29.
- **Visual:** Use `docs/workflow-diagram.svg`.
- **Follow-up post:** “A reply is a stop signal, not necessarily an intent classification.”
- **Next release:** STOP, START, and HELP handler, only after this release ships or is explicitly paused.

## Final edit before posting

Change “I am publishing” to “I published” only after the repository is public. Add the GitHub URL.
