import {PagefileMetaFn} from "vite-plugin-pagefiles";
import {Outlet} from "react-router";

export const Meta: PagefileMetaFn = () => ({
  layout: "AppLayout",
});

export default function PageLayout() {
  return <div>
    <h1>Page layout</h1>
    <hr/>
    <Outlet />
  </div>;
}
