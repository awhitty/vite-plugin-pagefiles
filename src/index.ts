import { Plugin } from "vite";

import { PagefileManager } from "./PagefileManager";
import type { UserOptions } from "./types";

function pagefilesPlugin(userOptions: UserOptions): Plugin {
  let mgr: PagefileManager;

  return {
    name: "vite-plugin-pagefiles",
    async configResolved(config) {
      mgr = new PagefileManager(userOptions, config);
      await mgr.searchAndAddFiles();
    },
    configureServer(server) {
      mgr.setupViteServer(server);
    },
    resolveId(id) {
      return mgr.resolveVirtualModule(id);
    },
    load(id) {
      return mgr.loadModule(id);
    },
  };
}

export default pagefilesPlugin;
export * from "./types";
