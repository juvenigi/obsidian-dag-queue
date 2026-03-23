import {ItemView} from "obsidian";
import {Canvas, CanvasView} from "@submodule/advanced-canvas/@types/Canvas";
import {CanvasData, CanvasNodeData} from "obsidian-advanced-canvas/assets/formats/advanced-json-canvas/spec/1.0-1.0";

export function checkIfCanvas(canvasView: ItemView | null): CanvasView | undefined {
	if (canvasView?.getViewType() !== 'canvas') {
		return
	}
	return canvasView as CanvasView
}

export function getSelectedNodes(canvas: Canvas): CanvasNodeData[] {
	const nodes: CanvasNodeData[] = [];

	for (const item of canvas.selection.values()) {
		const data = item.getData() as CanvasNodeData | undefined;
		if (data?.type) {
			nodes.push(data);
		}
	}

	return nodes;
}


export class NodePatcher {
	nodeIdMap = new Map<string, CanvasNodeData>();

	constructor(
		private data: CanvasData
	) {
		for (const item of data.nodes) {
			this.nodeIdMap.set(item.id, item);
		}
	}

	getCanvasData() {
		return {nodes: [...this.nodeIdMap.values()], edges: this.data.edges}
	}
}
