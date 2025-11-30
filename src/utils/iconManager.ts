import type { ProjectItem } from "../types/project";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

/**
 * 支持的图标文件扩展名
 */
export const SUPPORTED_ICON_EXTENSIONS = ["svg", "png", "jpg", "jpeg"] as const;

/**
 * 支持的图标文件扩展名类型
 */
export type SupportedIconExtension = (typeof SUPPORTED_ICON_EXTENSIONS)[number];

/**
 * 图标文件过滤器，用于文件选择对话框
 */
export const ICON_FILE_FILTERS: { [name: string]: string[] } = {
  "图片文件": [...SUPPORTED_ICON_EXTENSIONS],
  "SVG": ["svg"],
  "PNG": ["png"],
  "JPEG": ["jpg", "jpeg"],
};

/**
 * 图标管理器
 */
export class IconManager {
  constructor(private _context: vscode.ExtensionContext) {}

  /**
   * 检查文件是否为支持的图标格式
   * @param filePath 文件路径
   * @returns 是否为支持的图标格式
   */
  static isSupportedIconFormat(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    return SUPPORTED_ICON_EXTENSIONS.includes(ext as SupportedIconExtension);
  }

  /**
   * 获取支持的图标格式列表（用于显示）
   * @returns 格式化的扩展名列表字符串
   */
  static getSupportedFormatsDisplay(): string {
    return SUPPORTED_ICON_EXTENSIONS.map((ext) => `.${ext}`).join(", ");
  }

  /**
   * 获取项目图标路径
   * @param project 项目项
   * @param configFile 配置文件路径
   * @returns 图标路径，如果图标不存在则返回 undefined
   */
  getProjectIconPath(
    project: ProjectItem,
    configFile: string
  ): string | undefined {
    // 仅返回自定义图标路径或undefined
    if (!project.icon) {
      return undefined;
    }

    const globalIconPath = path.join(
      configFile ? path.dirname(configFile) : "",
      project.icon
    );
    
    try {
      return fs.existsSync(globalIconPath) ? globalIconPath : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * 获取文件夹图标路径
   * @param iconName 图标文件名
   * @param configFile 配置文件路径
   * @returns 图标路径，如果图标不存在则返回 undefined
   */
  getFolderIconPath(
    iconName: string,
    configFile: string
  ): string | undefined {
    if (!iconName) {
      return undefined;
    }

    const globalIconPath = path.join(
      configFile ? path.dirname(configFile) : "",
      iconName
    );
    
    try {
      return fs.existsSync(globalIconPath) ? globalIconPath : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * 生成唯一的图标文件名
   * @param baseName 原始文件名
   * @param globalDir 全局目录
   * @returns 唯一的文件名
   */
  private generateUniqueIconName(baseName: string, globalDir: string): string {
    const ext = path.extname(baseName);
    const nameWithoutExt = path.basename(baseName, ext);
    let uniqueName = baseName;
    let counter = 1;

    // 如果文件已存在，添加数字后缀
    while (fs.existsSync(path.join(globalDir, uniqueName))) {
      uniqueName = `${nameWithoutExt}_${counter}${ext}`;
      counter++;
    }

    return uniqueName;
  }

  /**
   * 复制图标到全局目录
   * @param iconSrc 源图标路径
   * @param configFile 配置文件路径
   * @returns 图标文件名
   * @throws 如果复制失败则抛出错误
   */
  copyIconToGlobal(iconSrc: string, configFile: string): string {
    const globalDir = path.dirname(configFile);
    
    // 确保目录存在
    if (!fs.existsSync(globalDir)) {
      fs.mkdirSync(globalDir, { recursive: true });
    }

    // 生成唯一的文件名以避免冲突
    const originalName = path.basename(iconSrc);
    const uniqueName = this.generateUniqueIconName(originalName, globalDir);
    const iconDest = path.join(globalDir, uniqueName);

    try {
      fs.copyFileSync(iconSrc, iconDest);
      return uniqueName;
    } catch (error) {
      vscode.window.showErrorMessage(`复制图标失败: ${error}`);
      throw error;
    }
  }

  /**
   * 检查图标文件是否存在
   * @param iconPath 图标路径
   * @returns 是否存在
   */
  iconExists(iconPath: string): boolean {
    try {
      return fs.existsSync(iconPath);
    } catch {
      return false;
    }
  }

  /**
   * 删除图标文件
   * @param iconName 图标文件名
   * @param configFile 配置文件路径
   * @returns 是否删除成功
   */
  deleteIcon(iconName: string, configFile: string): boolean {
    const iconPath = path.join(path.dirname(configFile), iconName);
    try {
      if (fs.existsSync(iconPath)) {
        fs.unlinkSync(iconPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
