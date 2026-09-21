# Quote chaser by SMS that stops on reply

An importable n8n workflow for following up on an unanswered quote without continuing to text after the customer replies.

This was packaged for Matthews Automation as a focused small-business workflow. The difficult part is not scheduling three messages. It is checking the conversation again before every send and handing control back to a person as soon as the customer responds.

## What it does

1. Receives a quote event by webhook.
2. Normalizes the phone number and plans three cumulative follow-up times.
3. Returns the plan immediately while the cadence runs in the background.
4. Notifies the owner that the chase started.
5. Before every nudge, checks Twilio for an inbound SMS from that customer after the chase began.
6. Stops and notifies the owner when any reply is found.
7. Sends up to three nudges when no reply is found, then tells the owner the cadence closed.

See [the workflow diagram](docs/WORKFLOW-DIAGRAM.md) or the [shareable SVG](docs/workflow-diagram.svg).

The [public-template gap check](docs/MARKET-GAP.md) explains how this differs from the closest official n8n examples. The [implementation decisions](docs/IMPLEMENTATION-DECISIONS.md) explain the design and its tradeoffs.

## Requirements

- n8n with Webhook, Set, Code, Respond to Webhook, If, Wait, HTTP Request, and Twilio nodes.
- One Twilio credential that can send SMS and read the Messages API.
- An SMS-capable Twilio sender.
- A phone you control for the first test.

## Setup

1. Import `workflow.json` into n8n.
2. Select the same Twilio credential on all six Twilio send nodes and all three reply-check HTTP nodes.
3. Open **Your settings** and replace:
   - `business_name`
   - `business_number`
   - `owner_cell`
   - `timezone`
   - `wait_1_days`, `wait_2_days`, and `wait_3_days`
   - the three nudge templates
4. Set the n8n workflow time zone to the same IANA zone.
5. Test with [the sample input](examples/sample-input.json), a controlled handset, and short fractional-day waits.
6. Confirm the webhook plan, every n8n branch, the Twilio terminal statuses, and the reply-stop behavior.
7. Only then activate the production webhook.

The packaged workflow contains no credentials and uses reserved `+1555...` numbers. It cannot send successfully until you configure real controlled values.

## Webhook contract

```json
{
  "phone": "+15555550123",
  "name": "Avery Test",
  "amount": "1850",
  "job": "water heater replacement",
  "quote_url": "https://example.com/quotes/demo"
}
```

`phone` is required. The other fields improve the message copy but are optional. The webhook responds before the Wait nodes finish. A successful plan resembles [the sample response](examples/sample-response.json); exact timestamps depend on the current time, time zone, and configured waits.

## Reply detection

Each check asks Twilio for inbound messages where:

- `From` is the quoted customer's normalized phone;
- `To` is the configured business number;
- the message was sent after this chase's `started_at` timestamp.

Any matching SMS reply stops the cadence. The workflow does not attempt to interpret intent. “Yes,” “no,” “later,” and “STOP” all hand the conversation back to the owner.

## Verification

The packaged planning logic passes 18 deterministic cases covering phone normalization, missing configuration, cumulative timing, accelerated waits, message tokens, reply timestamps, lookback dates, and duplicate input.

Run them with:

```text
node scripts/test-planning.js
```

Five retained full-workflow n8n executions provide live path evidence:

- execution 337: no reply, all three nudges, then owner closure;
- execution 338: first nudge sent, reply detected before nudge two, owner notified, cadence stopped;
- execution 340: invalid phone rejected before the cadence or any SMS send.
- execution 380: a reserved owner destination caused the first Twilio send to fail; the execution stopped with no retry or alternate alert;
- execution 381: the exact same synthetic payload was accepted as a second independent execution and failed at the same provider boundary.

Exact evidence boundaries are maintained in [STATUS.md](docs/STATUS.md) and the [isolated proof log](docs/PROOF-LOG.md).

## Known limitations

- No idempotency key or duplicate-event guard. Replaying the same quote starts another cadence.
- Any inbound SMS stops the chase; accepted, declined, delayed, and opt-out states are not distinguished.
- Replies by phone, email, form, or CRM update are invisible to this standalone workflow.
- Reply checks request at most 50 matching Twilio messages and do not paginate.
- Provider and API failures have no retry, alternate alert path, or durable failure queue; the execution stops at the failed node.
- There is no separate cancellation endpoint for a quote withdrawn through another system.
- Longer international numbers are normalized, but full E.164 validity is left to Twilio.
- The default copy does not append compliance language automatically. Configure messaging consent and opt-out handling for your jurisdiction and use case.
- This is an operational template, not legal advice or a complete consent-management system.

## Safe first test

- Use a synthetic customer and quote.
- Use only a handset you control.
- Set each wait to a small fractional day, such as `0.002` (about three minutes).
- Reply after nudge one and verify that nudges two and three never send.
- Run the same webhook twice deliberately so the duplicate limitation is visible.
- Use a reserved sender in a separate isolated copy to observe provider failure before production use.

## License

MIT. See [LICENSE](LICENSE).
