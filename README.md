# My Homebrew

A personal [FoundryVTT](https://foundryvtt.com) module containing homebrew items.

## Usage

### Installation

1. Open the setup page in Foundry VTT.
2. Click on the Add-on Modules tab.
3. Click the Install Module button.
4. Copy the [Manifest URL](https://raw.githubusercontent.com/DarkLight1337/my-homebrew/master/dist/module.json) to the bottom of the dialog.
5. Click on the Install button.

### Compendium Packs

The compendium pack "My Homebrew" contains the main content of this module. This content can be directly added to your world from the compendium without having to import them first.

### Macros

The macros are available under the global variable `MyHomebrew.Macros`. You can open the Developer tab of your browser (usually by pressing F12) and explore the code through the console.

## Development

### Requirements

- [npm](https://www.npmjs.com) 10.2+
- [Python](https://www.python.org) 3.8+

### Installation

1. Clone this repository to your machine.
2. Run `npm install` to setup the environment for JavaScript development.
3. Create a new world for testing this module.
4. Edit `./link_repo_to_local_vtt.py` and run it in Python to make this repository available to Foundry VTT via symbolic links.
    - Note that you should execute this in the same operating system as the one Foundry VTT is installed on.
    - You may need administrator privileges to create symbolic links on Windows.

### Live Testing

1. Open the test world.
    - For compendium content:
        1. Right-click the compendium pack and remove the edit lock.
        2. Edit the content of the compendium directly in the world.
        3. Any changes are automatically reflected in this repository.
    - For macros:
        1. Update the code in this repository.
        2. Run `npm run lint` to check the code.
            - Ignore any errors that are under `./node_modules/midi-qol`.
        3. Reload the web page to use the updated code.
            - If the code is somehow not updated, you may have to fully reload the world.

### Distributing

1. Increment the version number in `package.json`.
2. Run `npm run build` to generate the bundled files for other users to download the module.
3. Release the new version by pushing the commit to the remote repository.
