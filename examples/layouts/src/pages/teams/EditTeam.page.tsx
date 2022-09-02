import {PagefileMetaFn} from "vite-plugin-pagefiles";

export const Meta: PagefileMetaFn = () => ({
  path: "/teams/:teamId/edit",
});

export default function EditTeam() {
  return (
    <div>
      <h1>Edit Team</h1>
    </div>
  );
}
