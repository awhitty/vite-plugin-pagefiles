import {PagefileMetaFn} from "vite-plugin-pagefiles";
import {Outlet} from "react-router";

export const Meta: PagefileMetaFn = () => ({
  layout: "AppLayout",
});

export default function SeparatePageLayout() {
  return <div>
    <h1>Separate page layout</h1>
    <hr/>
    <Outlet />
  </div>;
}
