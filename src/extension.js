"use strict";
exports.__esModule = true;
exports.activate = void 0;
var vscode = require("vscode");
function activate(context) {
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("todoView", new TodoSidebarProvider(context.extensionUri)));
}
exports.activate = activate;
var TodoSidebarProvider = /** @class */ (function () {
    function TodoSidebarProvider(extensionUri) {
        this.extensionUri = extensionUri;
    }
    TodoSidebarProvider.prototype.resolveWebviewView = function (webviewView) {
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this.getHtml(webviewView.webview);
    };
    TodoSidebarProvider.prototype.getHtml = function (webview) {
        var styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", "style.css"));
        return "\n      <!DOCTYPE html>\n      <html lang=\"en\">\n      <head>\n        <meta charset=\"UTF-8\">\n        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n        <link href=\"".concat(styleUri, "\" rel=\"stylesheet\">\n        <title>To-Do List</title>\n      </head>\n      <body>\n        <div id=\"app\">\n          <h1>To-Do List</h1>\n          <ul id=\"todo-list\"></ul>\n          <input id=\"todo-input\" placeholder=\"Add a new task...\" />\n        </div>\n        <script>\n          const input = document.getElementById('todo-input');\n          const list = document.getElementById('todo-list');\n\n          input.addEventListener('keydown', (e) => {\n            if (e.key === 'Enter' && input.value.trim()) {\n              const li = document.createElement('li');\n              li.textContent = input.value.trim();\n              li.addEventListener('click', () => li.remove());\n              list.appendChild(li);\n              input.value = '';\n            }\n          });\n        </script>\n      </body>\n      </html>");
    };
    return TodoSidebarProvider;
}());
