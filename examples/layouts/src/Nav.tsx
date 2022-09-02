import {Link} from "react-router-dom";

export function Nav() {
  return <ul>
    <li><Link to="/">Home</Link></li>
    <li><Link to="/teams">Teams</Link></li>
    <li><Link to="/teams/new">New team</Link></li>
    <li><Link to="/contact">Contact</Link></li>
    <li><Link to="/privacy">Privacy</Link></li>
    <li><Link to="/bloop">404 Page</Link></li>
  </ul>;
}
