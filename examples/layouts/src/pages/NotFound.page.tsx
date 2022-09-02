import {PagefileMetaFn} from "vite-plugin-pagefiles";

export const Meta: PagefileMetaFn = () => ({
  path: "*",
  layout: 'SeparatePageLayout'
});

export default function NotFound() {
  return (
    <div>
      <h1>Not found!</h1>
    </div>
  );
}
