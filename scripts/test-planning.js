const fs = require('fs');
const path = require('path');

const workflowPath = path.resolve(__dirname, '..', 'workflow.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
const code = workflow.nodes.find((node) => node.name === 'Prepare the chase')?.parameters?.jsCode;
if (!code) throw new Error('Prepare the chase code was not found in workflow.json');

class UtcDateTime {
  static fixedNow = 0;

  constructor(milliseconds) {
    this.milliseconds = milliseconds;
  }

  static now() {
    return new UtcDateTime(UtcDateTime.fixedNow);
  }

  setZone() {
    return this;
  }

  plus(duration) {
    const days = Number(duration.days || 0);
    return new UtcDateTime(this.milliseconds + days * 86400000);
  }

  minus(duration) {
    const days = Number(duration.days || 0);
    return new UtcDateTime(this.milliseconds - days * 86400000);
  }

  set(parts) {
    const date = new Date(this.milliseconds);
    date.setUTCHours(
      parts.hour ?? date.getUTCHours(),
      parts.minute ?? date.getUTCMinutes(),
      parts.second ?? date.getUTCSeconds(),
      parts.millisecond ?? date.getUTCMilliseconds(),
    );
    return new UtcDateTime(date.getTime());
  }

  toUTC() {
    return this;
  }

  toISO() {
    return new Date(this.milliseconds).toISOString();
  }

  toFormat(pattern) {
    if (pattern !== 'yyyy-MM-dd') throw new Error(`Unsupported format: ${pattern}`);
    return new Date(this.milliseconds).toISOString().slice(0, 10);
  }
}

const executePlanningCode = new Function('DateTime', '$', code);

const defaults = {
  business_name: 'Test Business',
  business_number: '+15550000000',
  owner_cell: '+15550001111',
  timezone: 'UTC',
  wait_1_days: 2,
  wait_2_days: 3,
  wait_3_days: 4,
  nudge_1_text: 'Hi {name}, checking on {job} from {business}. {amount} {link}',
  nudge_2_text: 'Second note for {name} about {job}.',
  nudge_3_text: 'Last note for {name} from {business}.',
};

const validBody = {
  phone: '(404) 555-0123',
  name: 'Avery Test',
  amount: '1850',
  job: 'water heater replacement',
  quote_url: 'https://example.com/quotes/demo',
};

function runCase({ now = '2026-09-21T12:00:00Z', settings = {}, body = {} } = {}) {
  UtcDateTime.fixedNow = Date.parse(now);
  const values = {
    'Your settings': { ...defaults, ...settings },
    'Quote sent': { body: { ...validBody, ...body } },
  };
  const getNode = (name) => ({ first: () => ({ json: values[name] }) });
  return executePlanningCode(UtcDateTime, getNode)[0].json;
}

function receivedReply(messages, startedAt) {
  return (messages || []).some(
    (message) => new Date(message.date_sent) >= new Date(startedAt),
  );
}

const cases = [
  {
    name: 'normalizes a ten-digit US phone',
    run: () => runCase(),
    check: (r) => r.ok && r.phone === '+14045550123' && r.pretty === '(404) 555-0123',
  },
  {
    name: 'normalizes an eleven-digit US phone',
    run: () => runCase({ body: { phone: '1-404-555-0123' } }),
    check: (r) => r.phone === '+14045550123',
  },
  {
    name: 'preserves a longer international-format number',
    run: () => runCase({ body: { phone: '+44 20 7946 0958' } }),
    check: (r) => r.ok && r.phone === '+442079460958' && r.pretty === '+442079460958',
  },
  {
    name: 'rejects a short phone number',
    run: () => runCase({ body: { phone: '123' } }),
    check: (r) => !r.ok && r.phone === '',
  },
  {
    name: 'requires a configured business sender',
    run: () => runCase({ settings: { business_number: '' } }),
    check: (r) => !r.ok,
  },
  {
    name: 'requires a configured owner destination',
    run: () => runCase({ settings: { owner_cell: '' } }),
    check: (r) => !r.ok,
  },
  {
    name: 'plans default cumulative waits at 10am',
    run: () => runCase(),
    check: (r) => r.nudge_1_at === '2026-09-23T10:00:00.000Z'
      && r.nudge_2_at === '2026-09-26T10:00:00.000Z'
      && r.nudge_3_at === '2026-09-30T10:00:00.000Z',
  },
  {
    name: 'honors zero waits for accelerated testing',
    run: () => runCase({ settings: { wait_1_days: 0, wait_2_days: 0, wait_3_days: 0 } }),
    check: (r) => r.nudge_1_at === '2026-09-21T12:00:00.000Z'
      && r.nudge_2_at === r.nudge_1_at
      && r.nudge_3_at === r.nudge_1_at,
  },
  {
    name: 'keeps sub-day waits relative instead of forcing 10am',
    run: () => runCase({ settings: { wait_1_days: 0.125, wait_2_days: 0.125, wait_3_days: 0.125 } }),
    check: (r) => r.nudge_1_at === '2026-09-21T15:00:00.000Z'
      && r.nudge_2_at === '2026-09-21T18:00:00.000Z'
      && r.nudge_3_at === '2026-09-21T21:00:00.000Z',
  },
  {
    name: 'adds a dollar sign to a plain amount',
    run: () => runCase(),
    check: (r) => r.amount === '$1850',
  },
  {
    name: 'does not duplicate an existing dollar sign',
    run: () => runCase({ body: { amount: '$2,400' } }),
    check: (r) => r.amount === '$2,400',
  },
  {
    name: 'fills all supported message tokens',
    run: () => runCase(),
    check: (r) => r.nudge_1 === 'Hi Avery Test, checking on water heater replacement from Test Business. $1850 https://example.com/quotes/demo',
  },
  {
    name: 'uses a safe fallback when customer name is empty',
    run: () => runCase({ body: { name: '' } }),
    check: (r) => r.name === 'there' && r.nudge_1.startsWith('Hi there,'),
  },
  {
    name: 'reply after chase start is detected',
    run: () => receivedReply([{ date_sent: '2026-09-21T12:01:00Z' }], '2026-09-21T12:00:00Z'),
    check: (r) => r === true,
  },
  {
    name: 'reply before chase start is ignored',
    run: () => receivedReply([{ date_sent: '2026-09-21T11:59:00Z' }], '2026-09-21T12:00:00Z'),
    check: (r) => r === false,
  },
  {
    name: 'empty provider result means no reply',
    run: () => receivedReply([], '2026-09-21T12:00:00Z'),
    check: (r) => r === false,
  },
  {
    name: 'Twilio lookback starts on the previous UTC day',
    run: () => runCase(),
    check: (r) => r.since_day === '2026-09-20',
  },
  {
    name: 'duplicate trigger is independently accepted',
    run: () => [runCase(), runCase()],
    check: ([a, b]) => a.ok && b.ok && JSON.stringify(a) === JSON.stringify(b),
  },
];

let passed = 0;
for (const test of cases) {
  let result;
  let success = false;
  let error = '';
  try {
    result = test.run();
    success = Boolean(test.check(result));
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }
  if (success) passed += 1;
  console.log(`${success ? 'PASS' : 'FAIL'} | ${test.name}${error ? ` | ${error}` : ''}`);
  if (!success && result !== undefined) console.log(JSON.stringify(result, null, 2));
}

console.log(`RESULT | ${passed}/${cases.length} passed`);
if (passed !== cases.length) process.exitCode = 1;
