import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// 你可以把这些移动到配置文件或环境量
const ROOT = path.resolve(process.cwd(), "./");  
const REQUIRED_DIRS = [
  path.join(ROOT, "config"),        // 持久运行时配置（JSON 等）
//   path.join(ROOT, "logs"),          // 日志目录
//   path.join(ROOT, "tmp"),           // 临时文件
];

type FileSpec = {
  filePath: string;
  defaultContent: string | Buffer;
};

// 给出你希望“有就跳过、没有就创建”的文件清单
const REQUIRED_FILES: FileSpec[] = [
  {
    filePath: path.join(ROOT, "config", "people_map.json"),
    defaultContent: JSON.stringify({}, null, 2) + "\n",
  },
  {
    filePath: path.join(ROOT, "config", "people_blacklist.json"),
    defaultContent: JSON.stringify({}, null, 2) + "\n",
  },
  {
    filePath: path.join(ROOT, "config", "schedule-task.json"),
    defaultContent: JSON.stringify({}, null, 2) + "\n",
  }
];

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true }); // 已存在时静默通过
  console.log(`[init] ensured dir: ${path.relative(ROOT, dir)}`);
}

async function ensureFile(spec: FileSpec) {
  const { filePath, defaultContent } = spec;
  try {
    // 'wx'：仅当文件不存在时写入；存在则抛 EEXIST
    await writeFile(filePath, defaultContent, { flag: "wx" });
    console.log(`[init] created file: ${path.relative(ROOT, filePath)}`);
  } catch (err: any) {
    if (err && (err as NodeJS.ErrnoException).code === "EEXIST") {
      console.log(`[init] file exists, skip: ${path.relative(ROOT, filePath)}`);
      return;
    }
    // 其他错误抛出（权限、只读文件系统等）
    throw err;
  }
}

async function main() {
  console.log("[init] start bootstrap…");

  // 1) 目录
  for (const dir of REQUIRED_DIRS) {
    await ensureDir(dir);
  }

  // 2) 文件
  for (const file of REQUIRED_FILES) {
    await ensureFile(file);
  }

  console.log("[init] done.");
}

// 独立执行
main().catch((e) => {
  console.error("[init] failed:", e);
  process.exit(1);
});

process.exit(0);
