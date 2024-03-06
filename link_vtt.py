from pathlib import Path
import re

# Constants that are fixed
SCRIPT_ROOT = Path(__file__).parent

# Variables to be set by the developer
## The path to your Foundry VTT installation
FOUNDRY_INSTALL_DIR = Path('C:/Program Files/Foundry Virtual Tabletop')
## The path to your Foundry VTT user directory
FOUNDRY_DATA_DIR = Path('C:/Users/cyrus/AppData/Local/FoundryVTT')
## The ID of the module
MODULE_ID = 'my-homebrew'

def symlink_dir(src: Path, target: Path) -> None:
    link_path = src.absolute()

    if link_path.exists():
        if link_path.is_symlink():
            print(f'A symbolic link already exists at: {link_path}. Skipping.')
        else:
            print(f'A file or directory already exists at: {link_path}. Skipping.')
    else:
        link_path.symlink_to(target, target_is_directory=True)

def copy_with_classes_public_and_no_mixins(file: Path, name_suffix: str = '_') -> None:
    ENCODING = 'utf-8'

    outfile = file.with_stem(file.stem + name_suffix)

    outtext = file.read_text(ENCODING)
    outtext = re.sub('\nclass', '\nexport class', outtext)
    outtext = re.sub(r'extends [\w\.]+Mixin\(([\w\.]+)\)', r'extends \1', outtext)

    outfile.write_text(outtext, ENCODING)


# The commands that are run by the script
if __name__ == '__main__':
    # Allow Foundry VTT to access this module
    symlink_dir(FOUNDRY_DATA_DIR / 'Data' / 'modules' / MODULE_ID, SCRIPT_ROOT)

    # Provide type information to this repository
    symlink_dir(SCRIPT_ROOT / 'types' / 'dnd5e', SCRIPT_ROOT / 'node_modules' / 'dnd5e')
    symlink_dir(SCRIPT_ROOT / 'types' / 'foundry', FOUNDRY_INSTALL_DIR / 'resources' / 'app')

    copy_with_classes_public_and_no_mixins(SCRIPT_ROOT / 'types' / 'foundry' / 'public' / 'scripts' / 'foundry.js')
