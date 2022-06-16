import { PagefileMetaFn } from "vite-plugin-pagefiles";

export const Meta: PagefileMetaFn = () => ({
  path: "/sidebar",
});

export default function Sidebar() {
  return <div>
    <h1>This is the sidebar</h1>
  </div>;
}
