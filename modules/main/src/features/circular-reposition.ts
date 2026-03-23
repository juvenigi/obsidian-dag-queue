import {CanvasNodeData} from "obsidian-advanced-canvas/assets/formats/advanced-json-canvas/spec/1.0-1.0";
import {computeBounds, getEquidistantMappedCoords, getHeight, getWidth} from "@/helpers/geometry";
import {checkIfCanvas, getSelectedNodes} from "@/helpers/canvas-helper";
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

export function distributedRepositionInACircle(canvas: Canvas) {
	const selectedNodes = getSelectedNodes(canvas);
	if (selectedNodes.length === 0) {
		return
	}
	const helper = new NodePatcher(canvas);
	const {center, radius} = getCircleParameters(selectedNodes);
	const mappedCoords = getEquidistantMappedCoords(center, radius, selectedNodes.length);

	selectedNodes.forEach((v, idx) => {
		const node = helper.nodeIdMap.get(v.id);
		if (node && mappedCoords[idx]) {
			node.x = mappedCoords[idx].x;
			node.y = mappedCoords[idx].y;
		}
	})

	void canvas.setData(helper.getCanvasData());
}

export function repositionSelectedElements(canvas: Canvas) {
	const selectedNodes = getSelectedNodes(canvas);
	if (selectedNodes.length === 0) {
		return
	}
	const helper = new NodePatcher(canvas);
	const {center, radius} = getCircleParameters(selectedNodes);
	const radiusSquared = radius * radius;

	for (const item of selectedNodes) {
		// vector from center to node
		const dx = item.x - center.x;
		const dy = item.y - center.y;

		const smallRadiusSquared = dx * dx + dy * dy;

		// node is exactly at the center; cannot project directionlessly onto circle
		if (smallRadiusSquared === 0) {
			continue;
		}

		const scalingFactor = Math.sqrt(radiusSquared / smallRadiusSquared);

		const node = helper.nodeIdMap.get(item.id);
		if (node) {
			node.x = center.x + dx * scalingFactor;
			node.y = center.y + dy * scalingFactor;
		}
	}

	void canvas.setData(helper.getCanvasData());
}

function getCircleParameters(selectedNodes: CanvasNodeData[]) {
	const {bbox, center} = computeBounds(selectedNodes);
	const radius = Math.ceil(Math.max(getWidth(bbox), getHeight(bbox)) / 2);

	return {center, radius};
}

export class NodePatcher {
	nodeIdMap = new Map<string, CanvasNodeData>();

	constructor(
		private canvas: Canvas
	) {
		for (const item of canvas.getData().nodes) {
			this.nodeIdMap.set(item.id, item);
		}
	}

	getCanvasData() {
		return {nodes: [...this.nodeIdMap.values()], edges: this.canvas.getData().edges}
	}
}
