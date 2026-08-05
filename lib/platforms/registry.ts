import type { PlatformAdapter, PublishablePlatform } from "./types";

const adapters = new Map<PublishablePlatform, PlatformAdapter>();

export function registerPlatform(adapter: PlatformAdapter) {
  adapters.set(adapter.platform, adapter);
}

export function getPlatformAdapter(platform: PublishablePlatform) {
  const adapter = adapters.get(platform);
  if (!adapter) throw new Error(`${platform} publishing is not enabled in this deployment`);
  return adapter;
}
