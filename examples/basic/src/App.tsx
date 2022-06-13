import React, { Suspense } from "react";
import { BrowserRouter, useRoutes } from "react-router-dom";
import routes from "virtual:pagefiles";

function AppRoutes() {
  return <Suspense fallback={<div>Loading</div>}>{useRoutes(routes)}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
