export type PublishablePlatform = "linkedin" | "instagram" | "threads" | "facebook" | "x" | "bluesky" | "mastodon" | "tiktok";

export type PublishRequest = {
  idempotencyKey: string;
  externalAccountId: string;
  text: string;
  mediaUrls: string[];
};

export type PublishResult = {
  platformPostId: string;
  platformPostUrl?: string;
};

export interface PlatformAdapter {
  platform: PublishablePlatform;
  publish(request: PublishRequest, accessToken: string): Promise<PublishResult>;
  reply?(parentId: string, text: string, accessToken: string): Promise<PublishResult>;
}
