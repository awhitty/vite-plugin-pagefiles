import {PagefileMetaFn} from "vite-plugin-pagefiles";
import {Outlet} from "react-router";
import {useEffect, useState} from "react";

export const Meta: PagefileMetaFn = () => ({
  path: "/teams"
});

export default function TeamsLayout() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(interval);
  })

  return <div>
    <h1>Teams layout {count}</h1>
    <hr/>
    <Outlet/>
  </div>;
}
