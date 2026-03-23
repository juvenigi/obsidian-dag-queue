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

export function distributedRepositionInACircle(canvas: Canvas) {
	const selectedNodes = getSelectedNodes(canvas);
	if (selectedNodes.length === 0) {
		return
	}
	// fixme: typescript gives up here
	const patcher = new NodePatcher(canvas.getData() as any);
	const {center, radius} = getCircleParameters(selectedNodes);
	const mappedCoords = getEquidistantMappedCoords(center, radius, selectedNodes.length);

	selectedNodes.forEach((v, idx) => {
		const node = patcher.nodeIdMap.get(v.id);
		if (node && mappedCoords[idx]) {
			node.x = mappedCoords[idx].x;
			node.y = mappedCoords[idx].y;
		}
	})

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
