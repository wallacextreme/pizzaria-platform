import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const stageDir = path.join(root, ".pages-build");
const BASE_PATH = "/pizzaria-platform";

function copyTree(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

function linkNodeModules(srcModules, destModules) {
  const linkType = process.platform === "win32" ? "junction" : "dir";
  fs.symlinkSync(srcModules, destModules, linkType);
}

try {
  if (fs.existsSync(stageDir)) {
    fs.rmSync(stageDir, { recursive: true, force: true });
  }
  fs.mkdirSync(stageDir, { recursive: true });

  // Copia apenas os arquivos de build necessários para um diretório isolado,
  // mantendo src/ original 100% intacto mesmo se o processo for interrompido.
  const filesToCopy = [
    "src",
    "public",
    "next.config.ts",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.mjs",
    "postcss.config.js",
    "package.json",
  ];

  for (const entry of filesToCopy) {
    const srcPath = path.join(root, entry);
    if (fs.existsSync(srcPath)) {
      copyTree(srcPath, path.join(stageDir, entry));
    }
  }

  linkNodeModules(path.join(root, "node_modules"), path.join(stageDir, "node_modules"));

  const stageAppDir = path.join(stageDir, "src", "app");
  for (const dynRoute of ["api", "pedido"]) {
    const target = path.join(stageAppDir, dynRoute);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }

  const adminDir = path.join(stageAppDir, "admin");
  for (const f of ["layout.tsx", "page.tsx"]) {
    const fp = path.join(adminDir, f);
    if (fs.existsSync(fp)) fs.rmSync(fp, { force: true });
  }
  fs.mkdirSync(adminDir, { recursive: true });
  fs.writeFileSync(
    path.join(adminDir, "page.tsx"),
    `"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

export default function AdminStaticRedirect() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace("/demo?tab=cozinha");
  }, [router]);
  return (
    <div className="min-h-screen bg-pizza-charcoal text-pizza-cream flex items-center justify-center p-6 text-sm">
      Redirecionando para a Demo Sandbox da Cozinha / Kanban...
    </div>
  );
}
`,
    "utf8"
  );

  const fontsCss = path.join(stageAppDir, "fonts.css");
  if (fs.existsSync(fontsCss)) {
    const raw = fs.readFileSync(fontsCss, "utf8");
    fs.writeFileSync(
      fontsCss,
      raw.replace(/url\(['"]\/fonts\//g, `url('${BASE_PATH}/fonts/`),
      "utf8"
    );
  }

  execSync("npx next build", {
    cwd: stageDir,
    stdio: "inherit",
    env: {
      ...process.env,
      GITHUB_PAGES: "true",
      NEXT_PUBLIC_DEMO_STATIC: "true",
      NEXT_PUBLIC_BASE_PATH: BASE_PATH,
    },
  });

  const stageOut = path.join(stageDir, "out");
  const rootOut = path.join(root, "out");
  if (fs.existsSync(rootOut)) {
    fs.rmSync(rootOut, { recursive: true, force: true });
  }
  copyTree(stageOut, rootOut);
  fs.writeFileSync(path.join(rootOut, ".nojekyll"), "", "utf8");

  console.log("Static GitHub Pages PWA build completed safely in ./out");
} finally {
  if (fs.existsSync(stageDir)) {
    fs.rmSync(stageDir, { recursive: true, force: true });
  }
}
