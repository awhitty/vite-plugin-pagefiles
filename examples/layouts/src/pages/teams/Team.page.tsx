import {PagefileMetaFn} from "vite-plugin-pagefiles";
import {useParams} from "react-router";

export const Meta: PagefileMetaFn = () => ({
  path: "/teams/:teamId",
});

export default function Team() {
  const params = useParams<{ teamId: string }>()
  return (
    <div>
      <h1>Team {params.teamId}</h1>
    </div>
  );
}
