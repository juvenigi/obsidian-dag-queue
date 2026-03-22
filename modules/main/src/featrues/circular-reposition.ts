import {Canvas, SelectionData} from "@submodule/advanced-canvas/@types/Canvas";
import {
	CanvasEdgeData,
	CanvasNodeData
} from "obsidian-advanced-canvas/assets/formats/advanced-json-canvas/spec/1.0-1.0";

const canvas: Canvas = {} as Canvas

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
let item: CanvasNodeData | undefined = canvas.getSelectionData().nodes[0];


function createNodeIdMap(dataNodes: CanvasNodeData[], nodeMap: Map<string, CanvasNodeData> = new Map<string, CanvasNodeData>()): Map<string, CanvasNodeData> {
	for (const item of dataNodes) {
		nodeMap.set(item.id, item);
	}

	return nodeMap;
}

function repositionSelectedElements(canvas: Canvas, {center, nodes: selectedNodes}: SelectionData) {
	const {nodes, edges}: { nodes: CanvasNodeData[]; edges: CanvasEdgeData[]; } = canvas.getData();
	const nodeMap = createNodeIdMap(nodes);


	void canvas.setData({nodes: [...nodeMap.values()], edges})
}
