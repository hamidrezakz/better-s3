import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">better-s3</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          File upload, download &amp; delete with S3 presigned URLs
        </p>
      </div>

      <nav className="flex flex-col gap-3 w-full max-w-xs">
        <NavLink
          href="/upload"
          title="Upload"
          desc="Single & multi file upload"
        />
        <NavLink
          href="/headless"
          title="Headless Hooks"
          desc="useUpload, useDownload, useDelete"
        />
      </nav>

      <p className="text-xs text-zinc-400 dark:text-zinc-600">
        Using Cloudflare R2 — works with any S3-compatible storage
      </p>
    </main>
  );
}

function NavLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
      <span className="font-medium">{title}</span>
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{desc}</span>
    </Link>
  );
}
