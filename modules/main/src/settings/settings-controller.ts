import {MyPluginSettings} from "@/settings";
import MyPlugin from "@/main";
import {DEFAULT_SETTINGS} from "@/settings/defaults";
import {MySettingTab} from "@/settings/settings-tab";

export default class SettingsController {

	private _settings: MyPluginSettings;

	constructor(
		private plugin: MyPlugin,
		onDiskData: Partial<MyPluginSettings>
	) {
		this.settings = onDiskData;
		this.drawSettingsTab();
	}

	set settings(data: Partial<MyPluginSettings>) {
		this._settings = Object.assign({}, DEFAULT_SETTINGS, data);
	}

	get settings(): MyPluginSettings {
		return this._settings;
	}

	async saveSettings() {
		await this.plugin.saveData(this.plugin.settings);
	}

	private drawSettingsTab() {
		this.plugin.addSettingTab(new MySettingTab(this.plugin, this));
	}
}
