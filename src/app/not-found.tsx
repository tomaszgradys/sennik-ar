import SearchBox from "@/components/SearchBox";
import { T } from "@/locales/pl";

export default function NotFound() {
  return (
    <div className="py-10 text-center">
      <h1 className="text-3xl font-bold text-text">{T.notFound.title}</h1>
      <p className="mx-auto mt-3 max-w-md text-text-muted">{T.notFound.lead}</p>
      <div className="mx-auto mt-6 max-w-xl">
        <SearchBox autoFocus />
      </div>
    </div>
  );
}
