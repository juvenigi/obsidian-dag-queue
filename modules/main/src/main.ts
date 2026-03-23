import {MarkdownView, Plugin} from 'obsidian';
import {MyPluginSettings} from "./settings";
import BasicModal from "@/ui/basic-modal";
import SettingsController from "@/settings/settings-controller";
import {CircularRepositionRegistry} from "@/features/circular-reposition";

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	settingsController: SettingsController;

	async onload() {
		const onDiskData = await this.loadData() as Partial<MyPluginSettings>;
		this.settingsController = new SettingsController(this, onDiskData);

		CircularRepositionRegistry.registerCommands(this);

		this.addCommand({
			id: 'open-modal-complex',
			name: 'Open modal (complex)',
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);

				if (!markdownView || checking) {
					return !!markdownView
				}

				new BasicModal(this.app).open();

				return true
			}
		});
	}
}
