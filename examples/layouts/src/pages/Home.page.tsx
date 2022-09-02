import {PagefileMetaFn} from "vite-plugin-pagefiles";

export const Meta: PagefileMetaFn = () => ({
  path: "/",
});

export default function HomePage() {
  return (
    <div>
      <h1>Home</h1>
    </div>
  );
}
