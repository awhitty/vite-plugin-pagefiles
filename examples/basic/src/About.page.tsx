import { Link } from "react-router-dom";
import { PagefileMeta } from "vite-plugin-pagefiles";

export const meta: PagefileMeta = {
  path: "/about",
  key: ["about"],
};

export default function About() {
  return (
    <div>
      <h1>About</h1>
      <Link to="/">Go home</Link>
    </div>
  );
}
