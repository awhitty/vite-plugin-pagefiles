import { Link } from "react-router-dom";
import { PagefileMeta } from "vite-plugin-pagefiles";

export const meta: PagefileMeta = {
  path: "/",
  key: ["home"],
};

export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to the homepage</p>
      <Link to="/about">Go to about page</Link>
    </div>
  );
}
