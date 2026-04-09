# BetterChat #
BetterChat is an unofficial addon for TeamSpeak 6 and aims to provide a better chat experience for the TeamSpeak 6 client.
It enables support for BBCodes, improving messages sent by TeamSpeak 3 users, and automatic rich embeds for any website, including dedicated embeds for video, audio, image and twitter content.
It works in both compact and detailed view.

## BBCode support ##  
BetterChat readds support for BBCodes in chat, just like in TeamSpeak 3.
Currently, the following tags are supported:

| Code      | Syntax                                                                            | Example                                    |
|-----------|-----------------------------------------------------------------------------------|--------------------------------------------|
| bold      | [b]bold[/b]                                                                       | ![bold](images/bbcodes/bold.png)           |
| code      | [code]text[/code]                                                                 | ![code](images/bbcodes/code.png)           |
| color     | [color=#FFA500]hexcode[/color] or [color=orange]css color[/color]                 | ![color](images/bbcodes/color.png)         |
| italic    | [i]italic[/i]                                                                     | ![italic](images/bbcodes/italic.png)       |
| spoiler   | [spoiler]spoiler[/spoiler]                                                        | ![spoiler](images/bbcodes/spoiler.png)     |
| strike    | [s]strike[/s]                                                                     | ![strike](images/bbcodes/strike.png)       |
| underline | [u]underline[/u]                                                                  | ![underline](images/bbcodes/underline.png) |
| url       | [url]ht<span>tps://example.com[/url] or [url=ht<span>tps://example.com]text[/url] | ![url](images/bbcodes/url.png)             |
| pre       | [pre]inline code[/pre]                                                            | ![pre](images/bbcodes/pre.png)             |

## Rich Embeds ##
BetterChat supports automatic rich embeds for any website, including dedicated embeds for video, audio, image and twitter content.
Due to technical limitations, not all video and audio formats are supported at the moment.

### Video Embed ###
![Video Embed](images/embeds/video.png)

### Audio Embed ###
![Audio Embed](images/embeds/audio.png)

### Twitter Embed ###
![Twitter Embed](images/embeds/twitter.png)

### Generic Embed ###
![Generic Embed](images/embeds/generic.png)

## Styling ##
Custom styling for the image preview can be changed in the `static/betterchat/style.css`.
Rich embeds use the already existing CSS classes of the TeamSpeak client and should be compatible with already existing themes.

## Installation ##
> [!NOTE]
> * Depending on your installation directory you may need elevated permission privileges
> * The installation process needs to be repeated after each TeamSpeak update
> * Please check the [compatibility](https://github.com/Exopandora/BetterChat#compatibility) section before installing BetterChat
> * Installation for TeamSpeak 5 requires the [TS5AddonInstaller](https://github.com/FelixVolo/TS5AddonInstaller/releases)

### Installer ###
Installation steps:
1. Download the TS6AddonInstaller for your operating system from [here](https://github.com/Exopandora/TS6AddonInstaller/releases)
2. Start the installer
3. Select your TeamSpeak installation directory
4. Select "BetterChat"
5. Click on "Install"

## Configuration ##
BetterChat can be enabled and disabled while TeamSpeak is running.
Simply navigate to the Chats category of the TeamSpeak settings.
There you can toggle individual features, like BBCode support or Rich Embeds, or enable and disable the addon entirely.

![BetterChat Settings](images/settings.png)

## Building from source ##

### Requirements ###
1. A recent Node.js installation

### Compiling ###
Clone the repository and run the following commands in the root directory of this repository:
```shell
npm install
npm run build
```
The resulting archive can be found in the `build/zip` directory.

## Compatibility ##

| TeamSpeak 6 | Windows | Linux  | MacOS  |
|-------------|---------|--------|--------|
| Beta 3.4    | 3.4.0+  | 3.4.0+ | 3.4.0+ |
| Beta 3.3    | ❌       | ❌      | ❌      |
| Beta 3.2    | 3.3.0+  | 3.3.0+ | 3.3.0+ |
| Beta 3.1    | 3.2.0+  | 3.2.0+ | 3.2.0+ |
| Beta 3      | 3.1.0+  | 3.1.0+ | 3.1.0+ |
| Beta 2      | 3.0.0+  | 3.0.0+ | 3.0.0+ |

<details>
<summary>TeamSpeak 5</summary>

| TeamSpeak 5 | Windows       | Linux         | MacOS         |
|-------------|---------------|---------------|---------------|
| Beta 77     | 2.5.0-2.6.1   | 2.5.0-2.6.1   | 2.5.0-2.6.1   |
| Beta 76     | 2.4.0+        | 2.4.0+        | 2.4.0+        |
| Beta 75     | 2.3.0+        | 2.3.0+        | 2.3.0+        |
| Beta 74     | 2.1.0 - 2.2.1 | 2.1.0 - 2.2.1 | 2.1.0 - 2.2.1 |
| Beta 73     | 1.2.0 - 2.2.1 | 1.2.0 - 2.2.1 | 1.2.0 - 2.2.1 |
| Beta 72     | 1.1.0 - 2.2.1 | 1.1.0 - 2.2.1 | n/a           |
| Beta 71     | ❌             | ❌             | n/a           |
| Beta 70     | 1.0.0 - 1.0.4 | 1.0.0 - 1.0.4 | 1.0.0 - 1.0.4 |

</details>
