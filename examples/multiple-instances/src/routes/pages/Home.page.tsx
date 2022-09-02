import { PagefileMetaFn } from "vite-plugin-pagefiles";

export const Meta: PagefileMetaFn = () => ({
  path: "/",
});

export default function Home() {
  return (
    <div>
      <h1>Test</h1>
    </div>
  );
}
