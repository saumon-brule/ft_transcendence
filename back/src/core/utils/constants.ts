import { join } from "path";

export const COVER_DIR = join(process.cwd(), "uploads", "cover");
export const AVATAR_DIR = join(process.cwd(), "uploads", "avatars");
export const ASSET_DIR = join(process.cwd(), "assets");
export const MAX_SIZE = 5 * 1024 * 1024;
export const PROVIDER_KEY_PATH = join(process.cwd(), "provider.pem");
