import csTools from 'cornerstone-tools';

const BaseBrushTool = csTools.importInternal('base/BaseBrushTool');
const segmentationModule = csTools.getModule('segmentation');
const getCircle = csTools.importInternal('util/segmentationUtils').getCircle;
const drawBrushPixels = csTools.importInternal('util/segmentationUtils').drawBrushPixels;

export default class HelloWorldMouseTool extends BaseBrushTool {
  constructor(name = 'HelloWorldMouse') {
    super({
      name,
      supportedInteractionTypes: ['Mouse', 'Touch'],
      configuration: {},
    });
    this.touchDragCallback = this._paint.bind(this);
    this.eraseFlag = false;
    window.addEventListener('keydown', this.handleWheel.bind(this));
  }

  _paint(evt) {
    const { configuration } = segmentationModule;
    const eventData = evt.detail;
    const { rows, columns } = eventData.image;
    const { x, y } = eventData.currentPoints.image;

    if (x < 0 || x > columns || y < 0 || y > rows) {
      return;
    }

    const radius = configuration.radius;
    const pointerArray = getCircle(radius, rows, columns, x, y);

    const {
      labelmap2D,
      labelmap3D,
    } = this.paintEventData;

    drawBrushPixels(
        pointerArray,
        labelmap2D.pixelData,
        labelmap3D.activeSegmentIndex,
        columns,
        this.eraseFlag
    );
    window.cornerstone.updateImage(evt.detail.element);
  }

  handleWheel(event) {
    let { configuration } = segmentationModule;
    if (event.ctrlKey) {
      configuration.radius += configuration.radius > 50 ? 0 : 1;
    }
    if (event.altKey) {
      configuration.radius -= configuration.radius < 4 ? 0 : 1;
    }
  };

  renderBrush(evt) {
    const { getters, configuration } = segmentationModule;
    const eventData = evt.detail;
    const viewport = eventData.viewport;

    let mousePosition;

    if (this._drawing) {
      mousePosition = this._lastImageCoords;
    } else if (this._mouseUpRender) {
      mousePosition = this._lastImageCoords;
      this._mouseUpRender = false;
    } else {
      mousePosition = csTools.store.state.mousePositionImage;
    }

    if (!mousePosition) {
      return;
    }

    const { rows, columns } = eventData.image;
    const { x, y } = mousePosition;

    if (x < 0 || x > columns || y < 0 || y > rows) {
      return;
    }

    // Draw the hover overlay on top of the pixel data
    const radius = configuration.radius;
    const context = eventData.canvasContext;
    const element = eventData.element;
    const color = getters.brushColor(element, this._drawing);

    context.setTransform(1, 0, 0, 1, 0, 0);

    let circleRadius = radius * viewport.scale;
    const mouseCoordsCanvas = window.cornerstone.pixelToCanvas(
        element,
        mousePosition,
    );

    const { labelmap2D } = getters.labelmap2D(element);
    const pointerArray = getCircle(radius, rows, columns, x, y);

    const getPixelIndex = (x, y) => y * columns + x;
    let flag = 1;
    pointerArray.forEach(point => {
      const spIndex = getPixelIndex(...point);
      flag *= labelmap2D.pixelData[spIndex];
    });
    circleRadius = flag !== 0 ? circleRadius : circleRadius * 1.5;
    this.eraseFlag = flag === 0;
    context.beginPath();
    context.strokeStyle = color;
    context.ellipse(
        mouseCoordsCanvas.x,
        mouseCoordsCanvas.y,
        circleRadius,
        circleRadius,
        0,
        0,
        2 * Math.PI,
    );
    context.stroke();

    this._lastImageCoords = eventData.image;
  }
}
