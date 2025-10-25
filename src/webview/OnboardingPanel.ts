import * as vscode from "vscode";
import * as path from "path";

/**
 * 新手引导 Webview 面板
 * 交互式 todo + 图文
 */
export class OnboardingPanel {
  public static currentPanel: OnboardingPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _completedStep: number = 0;

  static readonly steps = [
    {
      title: "打开侧边栏",
      description:
        "点击左侧活动栏中的项目管理图标以打开 Project Manager 侧边栏。",
      image: "image.png",
    },
    {
      title: "基本功能说明",
      description: "项目支持分组、重命名、删除等，可右键快速操作。",
      image: "image-2.png",
    },
    {
      title: "项目右键操作",
      description: "在项目上右键可进行打开、重命名、设置图标等操作。",
      image: "image-3.png",
    },
  ];

  public static show(extensionUri: vscode.Uri) {
    if (OnboardingPanel.currentPanel) {
      OnboardingPanel.currentPanel._panel.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "projectManagerOnboarding",
      "项目管理器入门教程",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "resources", "readme-assets"),
        ],
      }
    );

    OnboardingPanel.currentPanel = new OnboardingPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // 设置 Webview 内容
    this._panel.webview.html = this._getHtmlForWebview();

    // Webview 消息监听：步骤完成/跳过
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        if (message.command === "next") {
          this._completedStep++;
          if (this._completedStep < OnboardingPanel.steps.length) {
            this._panel.webview.html = this._getHtmlForWebview();
          } else {
            // 完成全部，关闭面板
            this.dispose();
            vscode.commands.executeCommand(
              "workbench.view.extension.projectManagerSidebar"
            );
          }
        } else if (message.command === "skip") {
          this.dispose();
        }
      },
      undefined,
      this._disposables
    );

    // 销毁时清理
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public dispose() {
    OnboardingPanel.currentPanel = undefined;
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) {
        d.dispose();
      }
    }
    this._panel.dispose();
  }

  private _getHtmlForWebview(): string {
    const step = OnboardingPanel.steps[this._completedStep];
    const imgUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "resources",
        "readme-assets",
        step.image
      )
    );

    // todo 列表 html
    const todoList = OnboardingPanel.steps
      .map(
        (s, idx) =>
          `<li style="margin-bottom:12px; list-style:none;">
            <span style="
              display:inline-block;
              width:18px;height:18px;
              border-radius:4px;
              border:1px solid #888;
              background:${idx < this._completedStep ? "#4caf50" : "#fff"};
              color:${idx < this._completedStep ? "#fff" : "#333"};
              text-align:center;
              line-height:18px;
              margin-right:6px;">${
                idx < this._completedStep ? "✔" : idx + 1
              }</span>
            <span style="font-weight:${
              idx === this._completedStep ? "bold" : "normal"
            }">${s.title}</span>
          </li>`
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>项目管理器新手引导</title>
        <style>
          :root {
            --text-color: #292929;
            --desc-color: #555;
            --step-done-bg: #4caf50;
            --step-done-text: #fff;
            --step-todo-bg: #fff;
            --step-todo-text: #333;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --text-color: #e5e7ef;
              --desc-color: #b7b8cb;
              --step-done-bg: #53c86a;
              --step-done-text: #20222a;
              --step-todo-bg: #292929;
              --step-todo-text: #e5e7ef;
            }
          }
          @media (prefers-color-scheme: light) {
            :root {
              --text-color: #292929;
              --desc-color: #555;
              --step-done-bg: #4caf50;
              --step-done-text: #fff;
              --step-todo-bg: #fff;
              --step-todo-text: #333;
            }
          }
          body {
            font-family: "Segoe UI", "Noto Sans", "Arial", sans-serif;
            color: var(--text-color);
            background: transparent !important;
            margin:0;
            padding:0;
          }
          .main {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            /* 居中内容 */
          }
          .sidebar {
            width: 260px;
            /* background: none; 透明背景 */
            padding:32px 16px 16px 32px;
            /* box-shadow:2px 0 12px rgba(33,33,33,0.07);  */
            border-right: 1px solid #e0e0e020;
            /* 左侧轻微分隔，可选 */
          }
          .sidebar h2 { font-size:20px; margin-top:0; margin-bottom:18px;}
          .steps { margin-bottom:32px; }
          .right {
            flex:1;
            padding:32px 42px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .intro-title { font-size:19px; font-weight:bold; margin-bottom:18px;}
          .intro-desc { color: var(--desc-color); font-size:15px; margin-bottom:24px;}
          .img-card {
            background: none;
            border-radius:10px;
            box-shadow: none;
            padding:12px;
            text-align:center;
          }
          .img-card img { max-width:470px; width:98%; border-radius:9px; }
          .toolbar { margin-top:36px; text-align: center; }
          button { font-size:15px; border:none; border-radius:5px; padding:7px 28px; cursor:pointer; margin-right:14px; background:#3b7cff; color:#fff;}
          button.skip { background:#888;}
        </style>
      </head>
      <body>
        <div class="main">
          <aside class="sidebar">
            <h2>新手任务</h2>
            <ul class="steps">${todoList}</ul>
          </aside>
          <section class="right">
            <div class="intro-title">${step.title}</div>
            <div class="intro-desc">${step.description}</div>
            <div class="img-card"><img src="${imgUri}"/></div>
            <div class="toolbar">
              <button id="nextBtn">${
                this._completedStep < OnboardingPanel.steps.length - 1
                  ? "下一步"
                  : "完成体验"
              }</button>
              <button id="skipBtn" class="skip">跳过本教程</button>
            </div>
          </section>
        </div>
        <script>
          document.getElementById('nextBtn').onclick = function() {
            window.parent.postMessage({ command: 'next' }, '*');
            // 兼容 vscode api
            if(window.acquireVsCodeApi){
              acquireVsCodeApi().postMessage({ command: 'next' });
            }
          };
          document.getElementById('skipBtn').onclick = function() {
            window.parent.postMessage({ command: 'skip' }, '*');
            if(window.acquireVsCodeApi){
              acquireVsCodeApi().postMessage({ command: 'skip' });
            }
          };
        </script>
      </body>
      </html>
    `;
  }
}
