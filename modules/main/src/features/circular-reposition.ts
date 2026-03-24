import {CanvasNodeData} from "obsidian-advanced-canvas/assets/formats/advanced-json-canvas/spec/1.0-1.0";
import {computeBounds, getEquidistantMappedCoords, getHeight, getWidth} from "@/helpers/geometry";
import {checkIfCanvas, getSelectedNodes, NodePatcher} from "@/helpers/canvas-helper";
import MyPlugin from "@/main";
import {ItemView, Notice} from "obsidian";
import {Canvas} from "@submodule/advanced-canvas/@types/Canvas";


export class CircularRepositionRegistry {

	static registerCommands(plugin: MyPlugin) {
		const workspace = plugin.app.workspace;

		plugin.addCommand({
			id: 'circularize-canvas-nodes',
			name: 'Form a node circle',
			callback: () => {
				const view = checkIfCanvas(workspace.getActiveViewOfType(ItemView));
				if (!view?.canvas) {
					new Notice("No canvas view found");
					return
				}

				repositionSelectedElements(view.canvas);
			}
		});

		plugin.addCommand({
			id: 'circularize-canvas-nodes-distributed',
			name: 'Form a node circle (space-distributed)',
			callback: () => {
				const view = checkIfCanvas(plugin.app.workspace.getActiveViewOfType(ItemView));
				if (!view?.canvas) {
					new Notice("No canvas view found");
					return
				}

				distributedRepositionInACircle(view.canvas);
			}
		});
	}
}

const stateSnapshot = {
	radius: 0,
	center: {x: 0, y: 0},
	selectedNodes: [] as CanvasNodeData[]
}

// returns true if the input data matches snapshot value-wise
function compareAndSetSnapshot(nodes: CanvasNodeData[]): boolean {
	const {nodeIdMap} = new NodePatcher(stateSnapshot.selectedNodes as any);
	const {nodeIdMap: inputNodeIdMap} = new NodePatcher(nodes as any);
	if (nodeIdMap.size !== inputNodeIdMap.size) {
		stateSnapshot.selectedNodes = nodes;
		return false;
	}
	for (const [key, {x: valueX, y: valueY}] of inputNodeIdMap.entries()) {
		const canvasData = nodeIdMap.get(key);
		if (!canvasData) {
			stateSnapshot.selectedNodes = nodes;
			return false;
		}

		const {x, y} = canvasData;

		if (valueX !== x || valueY !== y) {
			stateSnapshot.selectedNodes = nodes;
			return false;
		}
	}

	return true;
}

const ROTATION_AMOUNT_RADIANS = 1

// properties: order-preserving. The output array index will correspond to node array index
function rotateByHardCodedRadians(
	center: { x: number; y: number },
	nodes: CanvasNodeData[],
): Array<{ x: number; y: number }> {
	const radians = ROTATION_AMOUNT_RADIANS;
	const cos = Math.cos(radians);
	const sin = Math.sin(radians);

	const res: Array<{ x: number; y: number }> = [];

	for (const node of nodes) {
		const nodeCenterX = node.x + node.width / 2;
		const nodeCenterY = node.y + node.height / 2;

		const dx = nodeCenterX - center.x;
		const dy = nodeCenterY - center.y;

		const rotatedCenterX = center.x + dx * cos - dy * sin;
		const rotatedCenterY = center.y + dx * sin + dy * cos;

		res.push({
			x: rotatedCenterX - node.width / 2,
			y: rotatedCenterY - node.height / 2,
		});
	}

	return res;
}


export function distributedRepositionInACircle(canvas: Canvas) {
	const selectedNodes = getSelectedNodes(canvas);
	if (selectedNodes.length === 0) {
		return
	}

	const patcher = new NodePatcher(canvas.getData() as any);
	let mappedCoords;
	if (compareAndSetSnapshot(selectedNodes)) {
		const {center} = stateSnapshot;
		mappedCoords = rotateByHardCodedRadians(center, selectedNodes);
	} else {
		const {center, radius} = getCircleParameters(selectedNodes);
		stateSnapshot.center = center;
		stateSnapshot.radius = radius;
		mappedCoords = getEquidistantMappedCoords(center, radius, selectedNodes.length);
	}
	selectedNodes.forEach((v, idx) => {
		const node = patcher.nodeIdMap.get(v.id);
		if (node && mappedCoords[idx]) {
			node.x = mappedCoords[idx].x;
			node.y = mappedCoords[idx].y;
		}
	});
	stateSnapshot.selectedNodes = selectedNodes;

	void canvas.setData(patcher.getCanvasData());
}

export function repositionSelectedElements(canvas: Canvas) {
	const selectedNodes = getSelectedNodes(canvas);
	if (selectedNodes.length === 0) {
		return
	}
	// fixme: typescript gives up here
	const patcher = new NodePatcher(canvas.getData() as any);
	const {center, radius} = getCircleParameters(selectedNodes);
	const radiusSquared = radius * radius;

	for (const item of selectedNodes) {
		const dx = item.x - center.x;
		const dy = item.y - center.y;

		const smallRadiusSquared = dx * dx + dy * dy;
		if (smallRadiusSquared === 0) {
			continue;
		}

		const scalingFactor = Math.sqrt(radiusSquared / smallRadiusSquared);
		const node = patcher.nodeIdMap.get(item.id);
		if (node) {
			node.x = center.x + dx * scalingFactor;
			node.y = center.y + dy * scalingFactor;
		}
	}

	void canvas.setData(patcher.getCanvasData());
}

function getCircleParameters(selectedNodes: CanvasNodeData[]) {
	const {bbox, center} = computeBounds(selectedNodes);
	const radius = Math.ceil(Math.max(getWidth(bbox), getHeight(bbox)) / 2);

	return {center, radius};
}
