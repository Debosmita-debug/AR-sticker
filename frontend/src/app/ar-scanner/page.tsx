import { redirect } from "next/navigation";
import StickerIdEntry from "@/components/StickerIdEntry";

type SearchParams = {
  id?: string | string[];
  pw?: string | string[];
};

export default function ArScannerPage({ searchParams }: { searchParams?: SearchParams }) {
  const rawId = searchParams?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (id) {
    const rawPw = searchParams?.pw;
    const pw = Array.isArray(rawPw) ? rawPw[0] : rawPw;
    const suffix = pw ? `?pw=${encodeURIComponent(pw)}` : "";
    redirect(`/scanner/${encodeURIComponent(id)}${suffix}`);
  }

  return <StickerIdEntry />;
}
