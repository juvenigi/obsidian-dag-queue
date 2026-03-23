import {PluginSettingTab, Setting} from "obsidian";
import MyPlugin from "../main";
import SettingsController from "@/settings/settings-controller";

export class MySettingTab extends PluginSettingTab {


	constructor(private plugin: MyPlugin, private controller: SettingsController) {
		super(plugin.app, plugin);
	}

	display(): void {
		this.containerEl.empty();

		new Setting(this.containerEl)
			.setName('Settings #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.controller.settings.mySetting)
				.onChange(async (value) => {
					this.controller.settings.mySetting = value;
					await this.controller.saveSettings();
				}));
	}
}
