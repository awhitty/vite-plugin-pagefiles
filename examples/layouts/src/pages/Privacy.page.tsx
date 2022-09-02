import {PagefileMetaFn} from "vite-plugin-pagefiles";

export const Meta: PagefileMetaFn = () => ({
  path: "/privacy",
  layout: "PageLayout"
});

export default function PrivacyPage() {
  return (
    <div>
      <h1>Privacy page</h1>
    </div>
  );
}
