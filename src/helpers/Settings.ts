import {TSClientInternal} from "../types/TSClient";

declare var tsclient_internal: TSClientInternal;

type Preferences = {
    [key: string]: any
}

export class Settings {
    private readonly id: string;
    private readonly defaults: Preferences = {};
    private userPreferences: Preferences = {...this.defaults};

    constructor(id: string, defaults: Preferences = {}) {
        this.id = id;
        this.defaults = Object.entries(defaults);
    }

    saveConfiguration() {
        tsclient_internal.saveJsonBlob(this.id, JSON.stringify(this.userPreferences));
    }

    populateSettings(callback: VoidFunction) {
        tsclient_internal.getJsonBlob(this.id, (error: any, blob: string) => {
            if (0 === error && blob.length > 0) {
                this.userPreferences = JSON.parse(blob);
                for (const key in Object.keys(this.defaults)) {
                    if (!(key in this.userPreferences)) {
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
