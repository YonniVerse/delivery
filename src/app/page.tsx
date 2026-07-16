import { redirect } from "next/navigation";

/** L'usage quotidien commence par les notes. */
export default function Home() {
  redirect("/notes");
}
