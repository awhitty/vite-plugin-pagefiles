import {PagefileMetaFn} from "vite-plugin-pagefiles";
import {Nav} from "../Nav";

export const Meta: PagefileMetaFn = () => ({
  path: "/contact",
  layout: null
});

export default function ContactPage() {
  return (
    <div>
      <h1>Contact page</h1>
      <Nav/>
      <div style={{background: '#aed', padding: 20}}>Contact us!</div>
    </div>
  );
}
