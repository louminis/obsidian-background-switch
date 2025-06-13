import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface BackgroundSettings {
  lightUrl: string;
  darkUrl: string;
  blur: number;
  contrast: number;
}

const DEFAULT_SETTINGS: BackgroundSettings = {
  lightUrl: '',
  darkUrl: '',
  blur: 0,
  contrast: 1,
};

export default class BackgroundPlugin extends Plugin {
  settings: BackgroundSettings;
  styleEl: HTMLStyleElement;

  async onload() {
    await this.loadSettings();

    // create a <style> tag we can update dynamically
    this.styleEl = document.createElement('style');
    document.head.appendChild(this.styleEl);

    // add our Settings tab
    this.addSettingTab(new BackgroundSettingTab(this.app, this));

    // apply once now…
    this.applyBackground();

    // …and again any time Obsidian’s CSS (i.e. theme) changes
    this.registerEvent(
      this.app.workspace.on('css-change', () => this.applyBackground())
    );
  }

  onunload() {
    this.styleEl.remove();
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  applyBackground() {
    const isDark = document.body.classList.contains('theme-dark');
    const url = isDark ? this.settings.darkUrl : this.settings.lightUrl;
    const blur = this.settings.blur;
    const contrast = this.settings.contrast;

    this.styleEl.textContent = `
      /* editor background */
      .cm-editor {
        background: url("${url}") no-repeat center center fixed !important;
        background-size: cover !important;
      }
      /* adjust how the text area sits on top */
      .cm-editor .cm-scroller {
        backdrop-filter: blur(${blur}px) contrast(${contrast});
      }
    `;
  }
}

class BackgroundSettingTab extends PluginSettingTab {
  plugin: BackgroundPlugin;

  constructor(app: App, plugin: BackgroundPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Editor-Background Settings' });

    new Setting(containerEl)
      .setName('Light-theme image URL')
      .setDesc('Public HTTPS link ending in .jpg/.png/.gif')
      .addText(text =>
        text
          .setPlaceholder('https://…')
          .setValue(this.plugin.settings.lightUrl)
          .onChange(async value => {
            this.plugin.settings.lightUrl = value;
            await this.plugin.saveSettings();
            this.plugin.applyBackground();
          })
      );

    new Setting(containerEl)
      .setName('Dark-theme image URL')
      .setDesc('Public HTTPS link ending in .jpg/.png/.gif')
      .addText(text =>
        text
          .setPlaceholder('https://…')
          .setValue(this.plugin.settings.darkUrl)
          .onChange(async value => {
            this.plugin.settings.darkUrl = value;
            await this.plugin.saveSettings();
            this.plugin.applyBackground();
          })
      );

    new Setting(containerEl)
      .setName('Background blur (px)')
      .setDesc('How fuzzy the wallpaper is behind your text')
      .addSlider(slider =>
        slider
          .setLimits(0, 20, 1)
          .setValue(this.plugin.settings.blur)
          .onChange(async value => {
            this.plugin.settings.blur = value;
            await this.plugin.saveSettings();
            this.plugin.applyBackground();
          })
      );

    new Setting(containerEl)
      .setName('Text-area contrast')
      .setDesc('Makes your text area stand out against the background')
      .addSlider(slider =>
        slider
          .setLimits(0.5, 2, 0.1)
          .setValue(this.plugin.settings.contrast)
          .onChange(async value => {
            this.plugin.settings.contrast = value;
            await this.plugin.saveSettings();
            this.plugin.applyBackground();
          })
      );
  }
}
