import * as path from "path";

/**
 * 保存项目列表到配置文件
 * @param projects 项目列表
 * @param CONFIG_FILE 配置文件路径
 */
export const saveProjects = (projects: ProjectItem[], CONFIG_FILE: string) => {
  const fs = require("fs");
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(projects, null, 2), "utf8");
};

/**
 * 从配置文件加载项目列表
 * @param CONFIG_FILE 配置文件路径
 * @returns 项目列表
 */
export const loadProjects = (CONFIG_FILE: string): ProjectItem[] => {
  try {
    const fs = require("fs");
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (e) {}
  return [];
};
