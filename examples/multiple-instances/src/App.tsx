import React, { Suspense } from "react";
import { BrowserRouter, useRoutes } from "react-router-dom";
import pageRoutes from "virtual:pagefiles/pages";
import sidebarRoutes from "virtual:pagefiles/sidebars";

function AppRoutes() {
  return (
    <div>
      <Suspense fallback={<div>Loading</div>}>{useRoutes(pageRoutes)}</Suspense>
      <Suspense fallback={<div>Loading</div>}>{useRoutes(sidebarRoutes)}</Suspense>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
