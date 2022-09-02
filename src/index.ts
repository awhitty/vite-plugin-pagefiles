import { Plugin } from "vite";

import { PLUGIN_NAME } from "./constants";
import { PagefileManager } from "./PagefileManager";
import type { UserOptions } from "./types";

function pagefilesPlugin(userOptions: UserOptions = {}): Plugin {
  let mgr: PagefileManager;

  return {
    name: PLUGIN_NAME,
    enforce: "pre",
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
