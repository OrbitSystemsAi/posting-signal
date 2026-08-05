export default {
  async scheduled(_controller, env, context) {
    context.waitUntil(triggerPublishing(env));
  },
};

async function triggerPublishing(env) {
  const response = await fetch(env.PUBLISH_URL, {
    headers: {
      Authorization: `Bearer ${env.CRON_SECRET}`,
      "User-Agent": "posting-signal-cloudflare-scheduler/1.0",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PostingSignal worker returned ${response.status}: ${body.slice(0, 200)}`);
  }

  console.log("Publishing worker completed", await response.json());
}
