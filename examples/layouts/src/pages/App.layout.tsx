import {PagefileMetaFn} from "vite-plugin-pagefiles";
import {Outlet} from "react-router";
import {Nav} from "../Nav";
import {Suspense} from "react";

export const Meta: PagefileMetaFn = () => ({
  path: "/",
});

export default function AppLayout() {
  return <div>
    <h1>AppLayout</h1>
    <Nav />
    <hr/>
    <Suspense fallback={<div>Loading</div>}>
      <Outlet />
    </Suspense>
  </div>;
}
