import { PagefileMeta } from "vite-plugin-pagefiles";

export const meta: PagefileMeta = {
  path: "/",
};

export default function Sidebar() {
  return <div>
    <h1>This is the sidebar</h1>
  </div>;
}
