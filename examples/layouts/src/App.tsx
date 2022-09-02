import React, {Suspense} from "react";
import {BrowserRouter, RouteObject, useRoutes} from "react-router-dom";
import pageRoutes from "virtual:pagefiles/pages";

function describeRoutes(routes: RouteObject[]) {
  function traverse(route: RouteObject): any {
    return {
      path: route.path,
      index: route.index,
      children: route.children?.map(traverse),
    }
  }

  return routes.map(traverse);
}

function AppRoutes() {
  return (
    <div>
      <Suspense fallback={
        <div>Loading</div>}>{useRoutes(pageRoutes)}</Suspense>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes/>
      <hr/>
      <pre>{JSON.stringify(describeRoutes(pageRoutes), null, 2)}</pre>
    </BrowserRouter>
  );
}
