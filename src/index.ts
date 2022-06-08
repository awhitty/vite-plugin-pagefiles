import type { ResolvedConfig } from "vite";

import { PageContext } from "./impl";
import type { UserOptions } from "./types";

function pagefilesPlugin(userOptions: UserOptions) {
  let ctx: PageContext;

  return {
    name: "vite-plugin-pagefiles",
    async configResolved(config: ResolvedConfig) {
      // // auto set resolver for react project
      // if (
      //   !userOptions.resolver &&
      //   config.plugins.find((i) => i.name.includes("vite:react"))
      // )
      //   userOptions.resolver = "react";
      //
      // // auto set resolver for solid project
      // if (
      //   !userOptions.resolver &&
      //   config.plugins.find((i) => i.name.includes("solid"))
      // )
      //   userOptions.resolver = "solid";

      ctx = new PageContext(userOptions, config.root);
      await ctx.searchGlob();
    },
  };
}

export default pagefilesPlugin;
export * from "./types";
