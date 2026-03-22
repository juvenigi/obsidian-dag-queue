import {App, Editor, ItemView, MarkdownView, Modal, Notice, Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab} from "./settings";
import {Canvas, CanvasView} from "@submodule/advanced-canvas/@types/Canvas";
import {repositionSelectedElements} from "@/featrues/circular-reposition";

// Remember to rename these classes and interfaces!

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	getCanvases(): Canvas[] {
		return this.app.workspace
			.getLeavesOfType('canvas')
			.map(leaf => (leaf.view as CanvasView)?.canvas)
			.filter(Boolean);
	}

	getCurrentCanvasView(): CanvasView | null {
		const canvasView = this.app.workspace.getActiveViewOfType(ItemView)
		if (canvasView?.getViewType() !== 'canvas') return null
		return canvasView as CanvasView
	}

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('dice', 'Sample', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status bar text');

		this.addCommand({
			id: 'circularize-canvas-nodes',
			name: 'Form a node circle',
			callback: () => {
				const currentView = this.getCurrentCanvasView();
				if (!currentView) {
					new Notice("No canvas view found");
					return
				}
				repositionSelectedElements(currentView.canvas);
			}
		})

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-modal-simple',
			name: 'Show Canvas Selection',
			callback: () => void this.showCanvasSelection()
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'replace-selected',
			name: 'Replace selected content',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				editor.replaceSelection('Sample editor command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-modal-complex',
			name: 'Open modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
				return false;
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MyPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private showCanvasSelection() {
		const view = this.app.workspace.getActiveViewOfType(ItemView);

		if (!view || view.getViewType() !== "canvas") {
			new Notice("Open a Canvas first.");
			return;
		}

		const canvasView = view as any;
		const canvas = canvasView.canvas;

		if (!canvas) {
			new Notice("Canvas internals not found.");
			return;
		}

		const summarizeElement = (el: any) => {
			if (!el) return null;

			return {
				id: el.id ?? null,
				type: el.type ?? null,
				label: el.label ?? null,

				// geometry
				x: el.x ?? el.pos?.x ?? el.position?.x ?? null,
				y: el.y ?? el.pos?.y ?? el.position?.y ?? null,
				width: el.width ?? null,
				height: el.height ?? null,

				// edge-ish fields
				fromNode: el.fromNode ?? el.from?.node?.id ?? el.from?.id ?? null,
				toNode: el.toNode ?? el.to?.node?.id ?? el.to?.id ?? null,
				fromSide: el.fromSide ?? null,
				toSide: el.toSide ?? null,

				// useful for inspection
				keys: Object.keys(el).sort(),
				constructorName: el.constructor?.name ?? null,
			};
		};

		const out: Record<string, unknown> = {
			viewType: view.getViewType(),
			canvasKeys: Object.keys(canvas).sort(),
			selectionType: typeof canvas.selection,
			selectionKeys:
				canvas.selection && typeof canvas.selection === "object"
					? Object.keys(canvas.selection).sort()
					: null,
		};

		// Whole selection as iterable
		try {
			const arr = canvas.selection ? Array.from(canvas.selection as Iterable<any>) : [];
			out.selectionArrayCount = arr.length;
			out.selectionArray = arr.map(summarizeElement);
		} catch (e) {
			out.selectionArrayError = String(e);
		}

		// Maybe split by nodes/edges if supported
		try {
			const nodes = canvas.selection?.nodes ? Array.from(canvas.selection.nodes as Iterable<any>) : [];
			out.selectionNodesCount = nodes.length;
			out.selectionNodes = nodes.map(summarizeElement);
		} catch (e) {
			out.selectionNodesError = String(e);
		}

		try {
			const edges = canvas.selection?.edges ? Array.from(canvas.selection.edges as Iterable<any>) : [];
			out.selectionEdgesCount = edges.length;
			out.selectionEdges = edges.map(summarizeElement);
		} catch (e) {
			out.selectionEdgesError = String(e);
		}

		let text: string;
		try {
			text = JSON.stringify(out, null, 2);
		} catch (e) {
			text = `Failed to stringify debug output:\n${String(e)}`;
		}

		new Notice("Reached end of command");
		new SelectionDumpModal(this.app, text).open();
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SelectionDumpModal extends Modal {
	constructor(app: App, private text: string) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.createEl("h2", {text: "Canvas selection dump"});

		const pre = contentEl.createEl("pre");
		pre.style.whiteSpace = "pre-wrap";
		pre.style.wordBreak = "break-word";
		pre.setText(this.text);
	}

	onClose() {
		this.contentEl.empty();
	}
}
