"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function activate(context) {
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('todoView', new TodoViewProvider(context)));
}
exports.activate = activate;
class TodoViewProvider {
    constructor(context) {
        this.context = context;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            throw new Error('No workspace folder');
        }
        this.todoFilePath = path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'todo.json');
        this.ensureTodoFile();
    }
    resolveWebviewView(webviewView, _context, _token) {
        const savedData = this.readTodoFile();
        webviewView.webview.options = {
            enableScripts: true,
        };
        // Resolve the path to the HTML file
        const htmlFilePath = path.join(this.context.extensionUri.fsPath, 'media', 'index.html');
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        // Replace placeholder for Webview URI in HTML
        const styleUri = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'style.css'));
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
                this.sendDataToWebview(webviewView);
            }
        });
        this.sendDataToWebview(webviewView);
    }
    sendDataToWebview(webviewView) {
        const savedData = this.readTodoFile();
        console.log('Sending saved data to webview:', savedData);
        webviewView.webview.postMessage({ type: 'load', data: savedData });
    }
    ensureTodoFile() {
        const dirPath = path.dirname(this.todoFilePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        if (!fs.existsSync(this.todoFilePath)) {
            console.log('Creating todo file:', fs.readFileSync(this.todoFilePath, 'utf8'));
            fs.writeFileSync(this.todoFilePath, JSON.stringify({ todo: [], completed: [] }, null, 2), 'utf8');
        }
    }
    readTodoFile() {
        try {
            return JSON.parse(fs.readFileSync(this.todoFilePath, 'utf8'));
        }
        catch (error) {
            console.error('Error reading todo file:', error);
            return { todo: [], completed: [] };
        }
    }
    writeTodoFile(data) {
        try {
            fs.writeFileSync(this.todoFilePath, JSON.stringify(data, null, 2), 'utf8');
        }
        catch (error) {
            console.error('Error writing to todo file:', error);
        }
    }
}
