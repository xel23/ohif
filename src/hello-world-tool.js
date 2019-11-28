import csTools from "cornerstone-tools";
const BaseTool = csTools.importInternal("base/BaseTool");

export default class HelloWorldMouseTool extends BaseTool {
  constructor(name = "HelloWorldMouse") {
    super({
      name,
      supportedInteractionTypes: ["Mouse"]
    });
  }

  preMouseDownCallback(evt) {
    console.log("Hello cornerstoneTools!");
  }

  activeCallback(element) {
    console.log(`Hello world plugin activated`);
  }

  disabledCallback(element) {
    console.log(`Hello world plugin deactivated`);
  }
}
