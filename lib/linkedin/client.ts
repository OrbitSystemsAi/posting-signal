import { env } from "@/lib/env";
import { PlatformPublishError, type PlatformAdapter, type PublishRequest, type PublishResult } from "@/lib/platforms/types";

const LINKEDIN_POSTS_URL = "https://api.linkedin.com/rest/posts";

export const linkedinAdapter: PlatformAdapter = {
  platform: "linkedin",
  async publish(request: PublishRequest, accessToken: string): Promise<PublishResult> {
    if (request.mediaUrls.length) throw new PlatformPublishError("LinkedIn media publishing is not enabled yet", false);
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
      // A 5xx response can be ambiguous after a create request. Only retry a
      // definitive rate-limit response automatically to avoid duplicate posts.
      const retryable = response.status === 429;
      throw new PlatformPublishError(`LinkedIn publish failed (${response.status}): ${details.slice(0, 300)}`, retryable);
    }
    const platformPostId = response.headers.get("x-restli-id");
    if (!platformPostId) throw new PlatformPublishError("LinkedIn did not return a post identifier", false);
    return { platformPostId };
  },
};
