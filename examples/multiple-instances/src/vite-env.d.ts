/// <reference types="vite/client" />

declare module "virtual:pagefiles/pages" {
  const routes: {
    path: string;
    element: JSX.Element;
  }[];
  export default routes;
}

declare module "virtual:pagefiles/sidebars" {
  const routes: {
    path: string;
    element: JSX.Element;
  }[];
  export default routes;
}
