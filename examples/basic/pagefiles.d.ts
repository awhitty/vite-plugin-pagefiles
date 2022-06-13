import { PagefileMeta as BasePagefileMeta } from "vite-plugin-pagefiles";

declare module "vite-plugin-pagefiles" {
  export interface PagefileMeta extends BasePagefileMeta {
    key: string | string[];
  }
}
