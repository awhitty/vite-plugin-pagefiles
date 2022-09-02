import {PagefileMetaFn} from "vite-plugin-pagefiles";

export const Meta: PagefileMetaFn = () => ({
  path: "/teams/new",
});

export default function NewTeam() {
  return (
    <div>
      <h1>New Team</h1>
      <label>Name <input type="text"/></label>
      <button>Add</button>
    </div>
  );
}
