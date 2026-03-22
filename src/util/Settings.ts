declare var tsclient_internal: any

class BetterChatSettings {
    enabled: Boolean = true;
    chatStyling: Boolean = true;
    embeds: Boolean = true;
}

type LooseObject = {
    [key: string]: any
}

export class Settings {
    defaults: LooseObject = {};
    userPreferences: LooseObject = {...this.defaults};

    constructor() {
        this.configureDefaults();
    }

    configName(): string {
        return "betterchat";
    }

    configureDefaults() {
        this.defaults = Object.entries(new BetterChatSettings())
    }

    saveConfiguration() {
        tsclient_internal.saveJsonBlob(this.configName(), JSON.stringify(this.userPreferences));
    }

    populateSettings(callback: VoidFunction) {
        tsclient_internal.getJsonBlob(this.configName(), (err: any, json: any) => {
            if(0 === err && json.length > 0) {
                this.userPreferences = JSON.parse(json);
                for(const key in Object.keys(this.defaults)) {
                    if(!(key in this.userPreferences)) {
                        this.userPreferences[key] = this.defaults[key];
                    }
                }
            }
            callback();
        });
    }

    getValueForKey(key: string): any {
        return this.userPreferences[key];
    }

    setValueForKey(key: string, value: any) {
        this.userPreferences[key] = value;
        this.saveConfiguration();
    }
}
