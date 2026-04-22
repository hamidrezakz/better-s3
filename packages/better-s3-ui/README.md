# @better-s3/ui

Styled React components for better-s3 flows. The package ships Mira-flavored, shadcn-style components for upload, multi-upload, download, and delete.

Use it when you want production-ready UI fast. Keep the package if you want speed, restyle it with your own shadcn theme tokens, or build fully custom components with [`@better-s3/react`](../better-s3-react) when you want full source ownership.

> These components are designed around the [shadcn](https://ui.shadcn.com) styling model. Your app should already expose shadcn-style CSS variables such as `--background`, `--foreground`, `--primary`, `--border`, and friends.

## Install

```bash
pnpm add @better-s3/ui @better-s3/server @aws-sdk/client-s3
```

Peer dependencies:

- `react`
- `@base-ui/react`
- `class-variance-authority`
- `clsx`
- `lucide-react`
- `sonner`
- `tailwind-merge`

## Setup

Add the package stylesheet to your global CSS file and make sure your app already includes shadcn theme variables.

```css
@import "shadcn/tailwind.css";
@import "@better-s3/ui/styles.css";
```

If your project already uses shadcn with CSS variables, that is usually enough.

If you prefer source-owned UI instead of consuming the package, keep the better-s3 server and hook layers and compose your own components with `@better-s3/react` plus the [shadcn CLI](https://ui.shadcn.com/docs/cli).

## Components

```tsx
import { createS3Api } from "@better-s3/server";
import { Upload, MultiUpload, DownloadButton, DeleteButton } from "@better-s3/ui";

const api = createS3Api("/api/s3");

// Single upload (button or dropzone)
<Upload
  api={api}
  objectKey={(file) => `uploads/${file.name}`}
  variant="dropzone"
  accept={["image/*"]}
  maxFileSize={10 * 1024 * 1024}
/>

// Batch upload
<MultiUpload
  api={api}
  objectKey={(file) => `uploads/${file.name}`}
  maxFiles={10}
/>

// Download
<DownloadButton api={api} objectKey="report.pdf" fileName="report.pdf" />

// Delete with confirmation dialog
<DeleteButton api={api} objectKey="report.pdf" />
```

## When to use this package

- Use `@better-s3/ui` when you want fast setup with polished defaults.
- Use `@better-s3/react` when you want to build your own UI with your own components.
- Mix both when you want ready-made upload flows now and custom components later.

## License

MIT
