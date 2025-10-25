import type { ProjectItem } from "../types/project";
import * as path from "path";
import * as fs from "fs";
import * as vscode from "vscode";

/**
 * 保存项目列表到配置文件
 * @param projects 项目列表
 * @param configFile 配置文件路径
 */
export const saveProjects = (projects: ProjectItem[], configFile: string) => {
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

/**
 * 获取已经存在的项目
 * @param configFile 配置文件目录
 * @returns
 */
export const getFolderList = (configFile: string) => {
  const projects = loadProjects(configFile);
  const folderSet = new Set<string>();

  projects.forEach((project) => {
    if (project.folder) {
      folderSet.add(project.folder);
    }
  });
  return Array.from(folderSet);
};

/**
 * 通用的选择文件夹方法
 * @description 允许选择新文件夹, 或者已经存在的文件夹; 如果选择新文件夹, 则自动获取输入
 * @param configFile 配置文件路径 会自动进行读取
 * @param message 配置信息内容
 * @returns 选择的文件夹的名称, 如果是根目录则为undefined 否则为对应文件夹的名称
 */
export const commonSelectFolder = async (
  configFile: string,
  message: string
) => {
  let folderName: string | undefined;
  const folderList = getFolderList(configFile);
  const selectedFolder = await vscode.window.showQuickPick(
    ["新建文件夹", ...folderList, "根目录"],
    {
      placeHolder: message,
      canPickMany: false,
    }
  );
  if (selectedFolder === "新建文件夹") {
    folderName = await vscode.window.showInputBox({
      prompt: "输入新文件夹名称",
    });
  } else if (selectedFolder !== "根目录") {
    folderName = selectedFolder;
  } else {
    folderName = undefined;
  }
  return folderName;
};
