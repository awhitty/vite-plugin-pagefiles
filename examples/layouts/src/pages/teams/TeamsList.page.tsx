import {PagefileMetaFn} from "vite-plugin-pagefiles";
import {Link} from "react-router-dom";

export const Meta: PagefileMetaFn = () => ({
  path: "/teams",
});

export default function Team() {
  return (
    <div>
      <h1>Teams list</h1>
      <ul>
        <li><Link to="/teams/abc">Team abc</Link></li>
      </ul>
    </div>
  );
}
