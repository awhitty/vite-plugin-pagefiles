import {PagefileMetaFn} from "vite-plugin-pagefiles";

export const Meta: PagefileMetaFn = () => ({
  path: "/teams/*",
});

export default function TeamNotFound() {
  return (
    <div>
      <h1>Team not found!</h1>
    </div>
  );
}
