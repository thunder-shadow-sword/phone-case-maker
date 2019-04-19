import Vue from 'vue';
import { toPng } from 'dom-to-image';
import CanvasSticker from '../components/DropElements/CanvasSticker.vue';
import CanvasText from '../components/DropElements/CanvasText.vue';
import store from '../stores/store';

// let getElements = store.getters['canvas/getElements'];
// var getBackgroundImage = store.getters['background/backgroundImage'];
// let getBackgroundAlignX = store.getters['background/alignmentX'];
// let getBackgroundAlignY = store.getters['background/alignmentY'];
// let getBackgroundSize = store.getters['background/backgroundSize'];

function buildUpscaledElementsFromStoreElements(sourceRes = { w: 258, h: 541 }, targetRes = { w: 875, h: 1840 }) {
  const factorX = targetRes.w / sourceRes.w;
  const factorY = targetRes.h / sourceRes.h;

  const elements = store.getters['canvas/getElements'];
  const printElements = elements.map(e => ({
    ...e,  //unaltered properties
    left: e.left * factorX,
    top: e.top * factorY,
    height: e.height * factorY,
    width: e.width * factorX,
    fontSize: e.fontSize * factorX
  }));

  return printElements;
}

function createPrintSticker(element) {
  const componentClass = Vue.extend(CanvasSticker);
  const printSticker = new componentClass({
    store,
    propsData: {
      src: element.src
    }
  });
  printSticker.$mount();

  return printSticker.$el;
}

function createPrintText(element) {
  const componentClass = Vue.extend(CanvasText);
  const printText = new componentClass({
    store,
    propsData: {
      color: element.color,
      font: element.font,
      text: element.text
    }
  });
  printText.$mount();

  return printText.$el;
}

function createPrintElement(element) {
  const printElement = element.type === 'sticker' ? createPrintSticker(element) : createPrintText(element);
  printElement.style.position = 'absolute';
  printElement.style.left = `${element.left}px`;
  printElement.style.top = `${element.top}px`;
  printElement.style.height = `${element.height}px`;
  printElement.style.width = `${element.width}px`;
  printElement.style.fontSize = `${element.fontSize}px`;
  printElement.style.transform = element.transform;
  printElement.style.zIndex = element.zIndex;

  const rg = new RegExp(/"/, 'g');
  printElement.style.fontFamily = printElement.style.fontFamily ?
    printElement.style.fontFamily.replace(rg, '') : '';

  return printElement;
}

function buildPrintCanvas(
  elements,
  background = {
    src: '',
    alignX: 'center',
    alignY: 'center',
    size: '100% 100%'
  },
  resolution = { w: 875, h: 1840 }
) {
  const printCanvas = document.createElement('div');
  // Sets up canvas 
  printCanvas.id = 'print-canvas';
  printCanvas.className = 'print-canvas';
  printCanvas.style.width = `${resolution.w}px`;
  printCanvas.style.height = `${resolution.h}px`;

  // Canvas background properties
  printCanvas.style.backgroundImage = `url(${background.src})`;
  printCanvas.style.backgroundSize = background.size;
  printCanvas.style.backgroundPosition = `${background.alignY} ${background.alignX}`;

  elements.forEach(e => {
    const element = createPrintElement(e);
    printCanvas.append(element);
  });

  return printCanvas;
}

export function printCanvasImage(imageName = 'phone-case') {
  const upscaledElements = buildUpscaledElementsFromStoreElements();
  const printable = buildPrintCanvas(upscaledElements, {
    src: store.getters['background/backgroundImage'],
    alignX: store.getters['background/alignmentX'],
    alignY: store.getters['background/alignmentY'],
    size: store.getters['background/backgroundSize']
  });

  const printCanvas = document.getElementById('print-canvas');
  printCanvas.append(printable);

  setTimeout(() => {
    toPng(printCanvas, { quality: 0.98, width: 875, height: 1840 })
      .then(function (dataUrl) {
        let link = document.createElement('a');
        link.download = `${imageName}.png`;
        link.href = dataUrl;
        link.click();
        printable.remove();
      });
  }, 1500);
}
