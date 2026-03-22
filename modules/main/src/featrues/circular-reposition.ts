import {Canvas} from "@submodule/advanced-canvas/@types/Canvas";
import {
	CanvasEdgeData,
	CanvasNodeData
} from "obsidian-advanced-canvas/assets/formats/advanced-json-canvas/spec/1.0-1.0";


function getSelectedNodes(canvas: Canvas): CanvasNodeData[] {
	const nodes: CanvasNodeData[] = [];
	for (const item of canvas.selection.values()) {
		const data = item.getData() as CanvasNodeData | undefined;
		if (data?.type) {
			nodes.push(data);
		}
	}
	return nodes;
}

// callee insures selection is not empty
export function repositionSelectedElements(canvas: Canvas) {
	const selectedNodes: CanvasNodeData[] = getSelectedNodes(canvas);
	const {bbox, center} = computeBounds(selectedNodes);
	const {nodes, edges}: { nodes: CanvasNodeData[]; edges: CanvasEdgeData[]; } = canvas.getData();
	const nodeMap = createNodeIdMap(nodes);

	const radiusSquared = Math.square(Math.ceil(Math.min(getWidth(bbox), getHeight(bbox)) / 2));

	for (const item of selectedNodes) {
		// we are projecting the node's coords onto a circle
		// use pythagorean theorem to compute the distance from center to node (WLOG, we call it 'small radius')
		// then compute the smallRadius-radius scalingFactor
		const smallRadius = {
			x: item.x - center.x,
			y: item.y - center.y
		}
		const smallRadiusSquared = {
			xSquared: Math.square(smallRadius.x),
			ySquared: Math.square(smallRadius.y)
		}
		const scalingFactor = Math.sqrt(radiusSquared / (smallRadiusSquared.xSquared - smallRadiusSquared.ySquared))

		const node = nodeMap.get(item.id);
		if (node) {
			node.x = center.x + smallRadius.x * scalingFactor;
			node.y = center.y + smallRadius.y * scalingFactor;
		}
	}

	void canvas.setData({nodes: [...nodeMap.values()], edges})
}

function createNodeIdMap(dataNodes: CanvasNodeData[], nodeMap: Map<string, CanvasNodeData> = new Map<string, CanvasNodeData>()): Map<string, CanvasNodeData> {
	for (const item of dataNodes) {
		nodeMap.set(item.id, item);
	}

	return nodeMap;
}

// note: obsidian canvas's y axis is increasing top-to-bottom, likewise the x axis is left-to-right.
type BBox2D = {
	topLeft: { x: number, y: number },
	bottomRight: { x: number, y: number },
};

// callee insures the iterable is not empty
function computeBounds(nodes: Iterable<CanvasNodeData>): { bbox: BBox2D, center: { x: number, y: number } } {
	const topLeft = {x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER}
	const bottomRight = {x: Number.MIN_SAFE_INTEGER, y: Number.MIN_SAFE_INTEGER}

	for (const node of nodes) {
		topLeft.x = topLeft.x > node.x ? node.x : topLeft.x;
		topLeft.y = topLeft.y > node.y ? node.y : topLeft.y;
		bottomRight.x = bottomRight.x < node.x ? node.x : bottomRight.x;
		bottomRight.y = bottomRight.y < node.y ? node.y : bottomRight.y;
	}

	return {
		bbox: {topLeft, bottomRight},
		center: {x: topLeft.x + (bottomRight.x - topLeft.x) / 2, y: topLeft.y + (bottomRight.y - topLeft.y)}
	}
}

function getWidth(bbox: BBox2D): number {
	return bbox.bottomRight.x - bbox.topLeft.x
}

function getHeight(bbox: BBox2D): number {
	return bbox.bottomRight.y - bbox.topLeft.y
}
