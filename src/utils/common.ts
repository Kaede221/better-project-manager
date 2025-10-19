import * as path from "path";
import * as fs from "fs";

/**
 * 保存项目列表到配置文件
 * @param projects 项目列表
 * @param configFile 配置文件路径
 */
export const saveProjects = (
  projects: ProjectItem[],
  configFile: string
): void => {
  const dir = path.dirname(configFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configFile, JSON.stringify(projects, null, 2), "utf8");
};

/**
 * 从配置文件加载项目列表
 * @param configFile 配置文件路径
 * @returns 项目列表
 */
export const loadProjects = (configFile: string): ProjectItem[] => {
  try {
    if (fs.existsSync(configFile)) {
      const raw = fs.readFileSync(configFile, "utf8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("加载项目列表失败:", e);
  }
  return [];
};
