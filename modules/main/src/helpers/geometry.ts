
// note: obsidian canvas's y axis increases top-to-bottom, x axis left-to-right.
import {CanvasNodeData} from "obsidian-advanced-canvas/assets/formats/advanced-json-canvas/spec/1.0-1.0";

export type BBox2D = {
	topLeft: { x: number; y: number };
	bottomRight: { x: number; y: number };
};

// callee ensures the iterable is not empty
export function computeBounds(nodes: Iterable<CanvasNodeData>): {
	bbox: BBox2D;
	center: { x: number; y: number };
} {
	const topLeft = {x: Infinity, y: Infinity};
	const bottomRight = {x: -Infinity, y: -Infinity};

	for (const node of nodes) {
		topLeft.x = Math.min(topLeft.x, node.x);
		topLeft.y = Math.min(topLeft.y, node.y);
		bottomRight.x = Math.max(bottomRight.x, node.x);
		bottomRight.y = Math.max(bottomRight.y, node.y);
	}

	return {
		bbox: {topLeft, bottomRight},
		center: {
			x: topLeft.x + (bottomRight.x - topLeft.x) / 2,
			y: topLeft.y + (bottomRight.y - topLeft.y) / 2,
		},
	};
}

export function getWidth(bbox: BBox2D): number {
	return bbox.bottomRight.x - bbox.topLeft.x;
}

export function getHeight(bbox: BBox2D): number {
	return bbox.bottomRight.y - bbox.topLeft.y;
}


export function getEquidistantMappedCoords(
	center: { x: number; y: number },
	radius: number,
	nodeCount: number
): Array<{ x: number; y: number }> {
	const res: Array<{ x: number; y: number }> = [];

	if (nodeCount <= 0) {
		return res;
	}

	const step = (Math.PI * 2) / nodeCount;

	for (let i = 0; i < nodeCount; i++) {
		const angle = step * i;

		res.push({
			x: center.x + radius * Math.cos(angle),
			y: center.y + radius * Math.sin(angle),
		});
	}

	return res;
}
