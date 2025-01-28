import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'todoView',
      new TodoViewProvider(context)
    )
  );
}

class TodoViewProvider implements vscode.WebviewViewProvider {
  private readonly todoFilePath: string;

  constructor(private readonly context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder is open.');
      throw new Error('No workspace folder');
    }
    this.todoFilePath = path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'todo.json');
    this.ensureTodoFile();
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {

    const savedData = this.readTodoFile();

    webviewView.webview.options = {
      enableScripts: true,
    };


    // Resolve the path to the HTML file
    const htmlFilePath = path.join(this.context.extensionUri.fsPath, 'media', 'index.html');
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

    // Replace placeholder for Webview URI in HTML
    const styleUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'style.css')
    );
    const resolvedHtmlContent = htmlContent.replace('./style.css', styleUri.toString());

    webviewView.webview.html = resolvedHtmlContent;

    webviewView.webview.onDidReceiveMessage(message => {
      console.log('Received message from webview:', message);
      if (message.type === 'save') {
        this.writeTodoFile(message.data);
      }
    });

    // Resend data whenever the Webview becomes visible
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.sendDataToWebview(webviewView)
      }
    });
    this.sendDataToWebview(webviewView)
  }

  private sendDataToWebview(webviewView: vscode.WebviewView): void {
    const savedData = this.readTodoFile();
    console.log('Sending saved data to webview:', savedData);
    webviewView.webview.postMessage({ type: 'load', data: savedData });
  }

  private ensureTodoFile(): void {
    const dirPath = path.dirname(this.todoFilePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    if (!fs.existsSync(this.todoFilePath)) {
      console.log('Creating todo file:', fs.readFileSync(this.todoFilePath, 'utf8'));
      fs.writeFileSync(this.todoFilePath, JSON.stringify({ todo: [], completed: [] }, null, 2), 'utf8');
    }
  }

  private readTodoFile(): any {
    try {
      return JSON.parse(fs.readFileSync(this.todoFilePath, 'utf8'));
    } catch (error) {
      console.error('Error reading todo file:', error);
      return { todo: [], completed: [] };
    }
  }

  private writeTodoFile(data: any): void {
    try {
      fs.writeFileSync(this.todoFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error writing to todo file:', error);
    }
  }
}
