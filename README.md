# better-s3

**This project has been renamed to [dimah-s3](https://github.com/dimah-kz/dimah-s3).**

`@better-s3/*` is **deprecated**. Do not install it for new work.

| Old | New |
| --- | --- |
| GitHub | [dimah-kz/dimah-s3](https://github.com/dimah-kz/dimah-s3) |
| Docs | [dimah-s3.vercel.app](https://dimah-s3.vercel.app) |
| Packages | `@dimah-s3/server`, `@dimah-s3/react`, `@dimah-s3/ui`, `@dimah-s3/db`, `@dimah-s3/cli` |

```bash
npm i @dimah-s3/server @dimah-s3/react @aws-sdk/client-s3
# optional
npm i @dimah-s3/ui @dimah-s3/db
```

Scaffold:

```bash
npx @dimah-s3/cli@latest create
```

Same author, same presign-first S3 lifecycle (upload, download, delete, multipart). Only the name and npm scope changed.

Existing apps on `@better-s3/*` should migrate. See the [dimah-s3 docs](https://dimah-s3.vercel.app/docs/quickstart). This repository is archived and will not receive updates.
