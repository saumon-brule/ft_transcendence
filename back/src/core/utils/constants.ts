import { join, resolve } from "path";
import { env } from "../env";

const UPLOADS_ROOT = resolve(env.UPLOADS_DIR);

export const COVER_DIR = join(UPLOADS_ROOT, "cover");
export const AVATAR_DIR = join(UPLOADS_ROOT, "avatars");
export const ASSET_DIR = join(process.cwd(), "assets");
export const MAX_SIZE = 5 * 1024 * 1024;
export const PROVIDER_KEY_PATH = resolve(env.PROVIDER_KEY_PATH);
