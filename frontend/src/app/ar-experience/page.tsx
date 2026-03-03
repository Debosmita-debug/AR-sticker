import { redirect } from "next/navigation";
import Link from "next/link";

type SearchParams = {
  id?: string | string[];
};

export default function ArExperiencePage({ searchParams }: { searchParams?: SearchParams }) {
  const rawId = searchParams?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (id) {
    redirect(`/ar/${encodeURIComponent(id)}`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="glass rounded-[2rem] p-8 sm:p-10 neon-border text-center max-w-md w-full space-y-4">
        <h1 className="text-2xl font-black italic">Missing Sticker ID</h1>
        <p className="text-muted-foreground text-sm">
          This link is missing a sticker ID. Use the full AR link or return home.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
