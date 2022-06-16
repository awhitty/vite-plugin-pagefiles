import { Link } from "react-router-dom";
import { PagefileMetaFn } from "vite-plugin-pagefiles";
import favicon from './favicon.svg';

export const Meta: PagefileMetaFn = () => ({
  path: "/",
  key: ["home"],
});

export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to the homepage</p>
      <img src={favicon} />
      <Link to="/about">Go to about page</Link>
    </div>
  );
}
