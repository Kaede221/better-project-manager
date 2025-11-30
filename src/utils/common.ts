import type { ProjectItem } from "../types/project";
import * as path from "path";
import * as fs from "fs";
import * as vscode from "vscode";

/**
 * 日志输出通道
 */
let outputChannel: vscode.OutputChannel | undefined;

/**
 * 获取日志输出通道
 */
function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("Better Project Manager");
  }
  return outputChannel;
}

/**
 * 记录日志
 * @param message 日志消息
 * @param level 日志级别
 */
export function log(
  message: string,
  level: "info" | "warn" | "error" = "info"
): void {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  getOutputChannel().appendLine(formattedMessage);
  
  if (level === "error") {
    console.error(formattedMessage);
  } else if (level === "warn") {
    console.warn(formattedMessage);
  } else {
    console.log(formattedMessage);
  }
}

/**
 * 验证项目数据结构
 * @param data 待验证的数据
 * @returns 是否为有效的项目数组
 */
function isValidProjectArray(data: unknown): data is ProjectItem[] {
  if (!Array.isArray(data)) {
    return false;
  }
  
  return data.every((item) => {
    return (
      typeof item === "object" &&
      item !== null &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.path === "string" &&
      (item.icon === undefined || typeof item.icon === "string") &&
      (item.folder === undefined || typeof item.folder === "string")
    );
  });
}

/**
 * 保存项目列表到配置文件
 * @param projects 项目列表
 * @param configFile 配置文件路径
 * @throws 如果保存失败则抛出错误
 */
export const saveProjects = (
  projects: ProjectItem[],
  configFile: string
): void => {
  try {
    const dir = path.dirname(configFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configFile, JSON.stringify(projects, null, 2), "utf8");
    log(`成功保存 ${projects.length} 个项目到配置文件`);
  } catch (error) {
    const errorMessage = `保存项目列表失败: ${error}`;
    log(errorMessage, "error");
    vscode.window.showErrorMessage(errorMessage);
    throw error;
  }
};

/**
 * 从配置文件加载项目列表
 * @param configFile 配置文件路径
 * @returns 项目列表
 */
export const loadProjects = (configFile: string): ProjectItem[] => {
  try {
    if (!fs.existsSync(configFile)) {
      log("配置文件不存在，返回空列表");
      return [];
    }
    
    const raw = fs.readFileSync(configFile, "utf8");
    const data: unknown = JSON.parse(raw);
    
    if (!isValidProjectArray(data)) {
      log("配置文件格式无效，返回空列表", "warn");
      return [];
    }
    
    log(`成功加载 ${data.length} 个项目`);
    return data;
  } catch (error) {
    log(`加载项目列表失败: ${error}`, "error");
    return [];
  }
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
): Promise<{ folderName: string | undefined; cancelled: boolean }> => {
  const folderList = getFolderList(configFile);
  const selectedFolder = await vscode.window.showQuickPick(
    ["新建文件夹", ...folderList, "根目录"],
    {
      placeHolder: message,
      canPickMany: false,
    }
  );

  // 用户取消了选择
  if (!selectedFolder) {
    return { folderName: undefined, cancelled: true };
  }

  if (selectedFolder === "新建文件夹") {
    const name = await vscode.window.showInputBox({
      prompt: "输入新文件夹名称",
    });
    // 取消输入或未填写则视为取消整个操作
    if (!name || !name.trim()) {
      return { folderName: undefined, cancelled: true };
    }
    return { folderName: name.trim(), cancelled: false };
  }

  if (selectedFolder === "根目录") {
    return { folderName: undefined, cancelled: false };
  }

  return { folderName: selectedFolder, cancelled: false };
};
