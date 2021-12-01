// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

const NOTIFICATION_OPTIONS: NotificationOptions = { timeout: 1000 };

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 230, height: 221 });

// 插件初始化之前需要检查是否已经选中图像
figma.ui.postMessage({ type: 'checkSelection', isSelectedTheImage: isSelectedTheImage() });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'extractColor') {
    getImageData();
  } else if (msg.type === 'copyResult') {
    // 提示是否复制成功或者失败
    figma.notify(msg.value ? "复制成功" : "复制失败，请手动复制", NOTIFICATION_OPTIONS);
  }
};

figma.on("selectionchange", () => {
  console.log('---------------- On Selection Change ----------------')
  figma.ui.postMessage({ type: 'checkSelection', isSelectedTheImage: isSelectedTheImage() });
})

function isSelectedTheImage() {
  const selection = figma.currentPage.selection;
  if (selection.length != 1) {
    return false;
  }
  const node = selection[0] as GeometryMixin
  if (!isSymbol(node.fills)) {
    for (const paint of node.fills) {
      if (paint.type === 'IMAGE') {
        return true;
      }
    }
  }
  return false;
}

async function getImageData() {
  // 判断选中的数量
  const selection = figma.currentPage.selection;
  if (selection.length != 1) {
    figma.notify("Please select an Image", NOTIFICATION_OPTIONS);
    return;
  }
  const selectedNode = selection[0];
  const imageName = selectedNode.name;
  const node = selectedNode as GeometryMixin
  // 判断图片和获取图片数据
  if (!isSymbol(node.fills)) {
    for (let paint of node.fills) {
      console.log('Paint Type = ' + paint.type)
      if (paint.type === 'IMAGE') {
        paint = paint as ImagePaint;
        console.log('Paint Scale Mode = ' + paint.scaleMode)
        let image = null;        
        if (paint.scaleMode === 'FILL') {
          // Get the (encoded) bytes for this image.
          image = figma.getImageByHash(paint.imageHash)   
        } else {
          image = figma.createImage(await selectedNode.exportAsync());
        }
        const bytes = await image.getBytesAsync();
        // Do something with the bytes!
        // figma.showUI(__html__, { visible: false })
        figma.ui.postMessage({ type: 'networkRequest', imageName: imageName, imageBytes: bytes })
      }
    }
  }
}

// 判断是否为 Symbol 
function isSymbol(property: any): property is Symbol {
  return typeof property === 'symbol';
}