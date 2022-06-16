
# vite-plugin-pagefiles

> Vite plugin to statically extract metadata from React component files and
generate client-side route declarations.

### ⚠️ Experimental

This plugin is pre-release, and its API is not stable. Use at your own risk. If
you have feedback and/or bugs along the way, feel free to open an issue.

The plugin also currently only supports React applications. If you're familiar
with other UI libraries, especially Vue, I'd be happy to help write support
code.

### How does it work?

This plugin allows you to write "pagefiles". A pagefile is a file that fully
define a single route in your application. Here's a very basic example:

```tsx
// Home.page.tsx
export const Meta = () => ({
  path: "/",
});

export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to the homepage</p>
    </div>
  );
}
```

The file has two exports: `Meta` and `default`.

`Meta` is a function that defines metadata about the route that is made
available at build-time. The only property in the object returned by this
function that matters to the plugin is `path`, which is used to generate the
route declaration, but you may add additional properties to handle as you wish.

Similar to other file-based routing solutions, the `default` export is used as
the page component.

## Why?

File-based routing solutions are great because they eliminate a lot of
boilerplate involved in adding routes to your application. However, they force
you to organize your code based on your URL organization, and they tend to incur
high levels of nesting. This can make it harder to maintain a complex
application.

Pagefiles is an alternative to file-based routing that still satisfies the story
around convenience. But by pushing the route metadata into the route's file itself,
you are free to make your own decisions about how you organize your code.

## Getting Started

#### NPM

The plugin is published on npm as `vite-plugin-pagefiles`.

```bash
npm install -D vite-plugin-pagefiles
````

### Vite config

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import pagefiles from 'vite-plugin-pagefiles'

export default defineConfig({
  plugins: [
    // ...
    pagefiles(),
  ],
});
```

### Use the generated routes in your App

```tsx
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
```

By default, the plugin imports pagefiles asynchronously using `React.lazy(() =>
...)` to take advantage of bundle splitting. This means it's necessary to wrap
the call to `useRoutes` in a `Suspense` block. This behavior is customizable.

### Create a "pagefile"

By default, the plugin uses the glob `src/**/*.page.tsx` to discover pagefiles
in your project.

Here's an example pagefile:

```tsx
import type { PagefileMetaFn } from "vite-plugin-pagefiles";

export const Meta: PagefileMetaFn = () => ({
  path: "/",
});

export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to the homepage</p>
    </div>
  );
}
```

## Acknowledgements

This plugin is based on
[vite-plugin-pages](https://github.com/hannoeru/vite-plugin-pages) and borrows
heavily from its design. Thank you, [@hannoeru](https://github.com/hannoeru) and
the other folks that have contributed to that project!

