import AdvancedCanvasPlugin from "@submodule/advanced-canvas/main";
import {
	AdvancedCanvasPluginSettingsValues,
	AdvancedCanvasPluginSettingTab,
	DEFAULT_SETTINGS_VALUES
} from "@submodule/advanced-canvas/settings";

// todo: rewire
export default class SettingsControllerWip {
	private readonly plugin: AdvancedCanvasPlugin
	private settings: AdvancedCanvasPluginSettingsValues
	private settingsTab: AdvancedCanvasPluginSettingTab


	constructor(plugin: AdvancedCanvasPlugin) {
		this.plugin = plugin
	}

	async loadSettings() {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		this.settings = Object.assign({}, DEFAULT_SETTINGS_VALUES, await this.plugin.loadData())
		this.plugin.app.workspace.trigger("advanced-canvas:settings-changed")
	}

	async saveSettings() {
		await this.plugin.saveData(this.settings)
	}

	getSetting<T extends keyof AdvancedCanvasPluginSettingsValues>(key: T): AdvancedCanvasPluginSettingsValues[T] {
		return this.settings[key]
	}

	async setSetting(data: Partial<AdvancedCanvasPluginSettingsValues>) {
		this.settings = Object.assign(this.settings, data)
		await this.saveSettings()
		this.plugin.app.workspace.trigger("advanced-canvas:settings-changed")
	}

	addSettingsTab() {
		this.settingsTab = new AdvancedCanvasPluginSettingTab(this.plugin, this)
		this.plugin.addSettingTab(this.settingsTab)
	}
}
