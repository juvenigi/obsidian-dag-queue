import {
	BooleanSetting, ButtonSetting,
	DimensionSetting,
	DropdownSetting,
	NumberSetting, StyleAttributesSetting,
	TextSetting
} from "@submodule/advanced-canvas/@types/Settings";
import {Notice, Setting as SettingEl, TextComponent} from "obsidian";
import {AdvancedCanvasPluginSettingsValues} from "@submodule/advanced-canvas/settings";
import SettingsController from "@/settings/settings-controller";

const README_URL = "";

export default class SettingElHelper {

	constructor(
		private settingsManager: SettingsController
	) {
	}

	private createFeatureHeading(containerEl: HTMLElement, label: string, description: string, infoSection: string | undefined, settingsKey: keyof AdvancedCanvasPluginSettingsValues | null): SettingEl {

		const setting = new SettingEl(containerEl)
			.setHeading()
			.setClass('ac-settings-heading')
			.setName(label)
			.setDesc(description)

		if (infoSection !== undefined) {
			setting.addExtraButton(button => button
				.setTooltip("Open GitHub documentation")
				.setIcon('info')
				.onClick(async () => {
					window.open(`${README_URL}#${infoSection}`)
				})
			)
		}

		if (settingsKey !== null) {
			setting.addToggle((toggle) =>
				toggle
					.setTooltip("Requires a reload to take effect.")
					.setValue(this.settingsManager.getSetting(settingsKey) as boolean)
					.onChange(async (value) => {
						await this.settingsManager.setSetting({ [settingsKey]: value })
						new Notice("Reload Obsidian to apply the changes.")
					})
			)
		}

		return setting
	}
	private createTextSetting(containerEl: HTMLElement, settingId: keyof AdvancedCanvasPluginSettingsValues, setting: TextSetting) {
		new SettingEl(containerEl)
			.setName(setting.label)
			.setDesc(setting.description)
			.addText(text => text
				.setValue(this.settingsManager.getSetting(settingId) as string)
				.onChange(async (value) => {
					await this.settingsManager.setSetting({ [settingId]: value})
				})
			)
	}

	private createNumberSetting(containerEl: HTMLElement, settingId: keyof AdvancedCanvasPluginSettingsValues, setting: NumberSetting) {
		new SettingEl(containerEl)
			.setName(setting.label)
			.setDesc(setting.description)
			.addText(text => text
				.setValue(this.settingsManager.getSetting(settingId).toString() ?? "")
				.onChange(async (value) => {
					await this.settingsManager.setSetting({ [settingId]: setting.parse(value) })
				})
			)
	}

	private createDimensionSetting(containerEl: HTMLElement, settingId: keyof AdvancedCanvasPluginSettingsValues, setting: DimensionSetting) {
		let text1: TextComponent
		let text2: TextComponent

		new SettingEl(containerEl)
			.setName(setting.label)
			.setDesc(setting.description)
			.addText(text => {
				text1 = text.setValue((this.settingsManager.getSetting(settingId) as [number, number])[0].toString())
					.onChange(async (value) => await this.settingsManager.setSetting({ [settingId]: setting.parse([value, text2.getValue()]) }))
			})
			.addText(text => {
				text2 = text.setValue((this.settingsManager.getSetting(settingId) as [number, number])[1].toString())
					.onChange(async (value) => await this.settingsManager.setSetting({ [settingId]: setting.parse([text1.getValue(), value]) }))
			})
	}

	private createBooleanSetting(containerEl: HTMLElement, settingId: keyof AdvancedCanvasPluginSettingsValues, setting: BooleanSetting) {
		new SettingEl(containerEl)
			.setName(setting.label)
			.setDesc(setting.description)
			.addToggle(toggle => toggle
				.setValue(this.settingsManager.getSetting(settingId) as boolean)
				.onChange(async (value) => {
					await this.settingsManager.setSetting({ [settingId]: value })
				})
			)
	}

	private createDropdownSetting(containerEl: HTMLElement, settingId: keyof AdvancedCanvasPluginSettingsValues, setting: DropdownSetting) {
		new SettingEl(containerEl)
			.setName(setting.label)
			.setDesc(setting.description)
			.addDropdown(dropdown => dropdown
				.addOptions(setting.options)
				.setValue(this.settingsManager.getSetting(settingId) as string)
				.onChange(async (value) => {
					await this.settingsManager.setSetting({ [settingId]: value })
				})
			)
	}

	private createButtonSetting(containerEl: HTMLElement, settingId: keyof AdvancedCanvasPluginSettingsValues, setting: ButtonSetting) {
		new SettingEl(containerEl)
			.setName(setting.label)
			.setDesc(setting.description)
			.addButton(button => button
				.setButtonText('Open')
				.onClick(() => setting.onClick())
			)
	}

	private createStylesSetting(containerEl: HTMLElement, settingId: keyof AdvancedCanvasPluginSettingsValues, setting: StyleAttributesSetting) {
		const nestedContainerEl = document.createElement('details')
		nestedContainerEl.classList.add('setting-item')
		containerEl.appendChild(nestedContainerEl)

		const summaryEl = document.createElement('summary')
		summaryEl.textContent = setting.label
		nestedContainerEl.appendChild(summaryEl)

		for (const styleAttribute of setting.getParameters(this.settingsManager)) {
			new SettingEl(nestedContainerEl)
				.setName(styleAttribute.label)
				.addDropdown(dropdown => dropdown
					.addOptions(Object.fromEntries(styleAttribute.options.map(option => [option.value, option.value === null ? `${option.label} (default)` : option.label])))
					.setValue((this.settingsManager.getSetting(settingId) as { [key: string]: string })[styleAttribute.key] ?? 'null')
					.onChange(async (value) => {
						const newValue = this.settingsManager.getSetting(settingId) as { [key: string]: string }

						if (value === 'null') delete newValue[styleAttribute.key]
						else newValue[styleAttribute.key] = value

						await this.settingsManager.setSetting({
							[settingId]: newValue
						})
					})
				)
		}
	}

}
