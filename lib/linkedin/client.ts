import { env } from "@/lib/env";
import type { PlatformAdapter, PublishRequest, PublishResult } from "@/lib/platforms/types";

const LINKEDIN_POSTS_URL = "https://api.linkedin.com/rest/posts";

export const linkedinAdapter: PlatformAdapter = {
  platform: "linkedin",
  async publish(request: PublishRequest, accessToken: string): Promise<PublishResult> {
    if (request.mediaUrls.length) throw new Error("LinkedIn media publishing is not enabled yet");
    const response = await fetch(LINKEDIN_POSTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Linkedin-Version": env.LINKEDIN_API_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: `urn:li:person:${request.externalAccountId}`,
        commentary: request.text,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      }),
    });
    if (!response.ok) {
      const details = await response.text();
      throw new Error(`LinkedIn publish failed (${response.status}): ${details.slice(0, 300)}`);
    }
    const platformPostId = response.headers.get("x-restli-id");
    if (!platformPostId) throw new Error("LinkedIn did not return a post identifier");
    return { platformPostId };
  },
};
