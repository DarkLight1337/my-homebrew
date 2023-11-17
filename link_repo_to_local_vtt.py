from pathlib import Path

# Constants that are fixed
SCRIPT_ROOT = Path(__file__).parent

# Variables to be set by the developer
## The path to your Foundry VTT user directory
FOUNDRY_DIR = Path('C:/Users/cyrus/AppData/Local/FoundryVTT')
## The ID of the module
MODULE_ID = 'my-homebrew'

# The commands that are run by the script
if __name__ == '__main__':
    link_path = (FOUNDRY_DIR / 'Data' / 'modules' / MODULE_ID).absolute()

    if link_path.exists():
        if link_path.is_symlink():
            print(f'A symbolic link already exists at: {link_path}')
        else:
            print(f'A file or directory already exists at: {link_path}')
    else:
        link_path.symlink_to(SCRIPT_ROOT, target_is_directory=True)
