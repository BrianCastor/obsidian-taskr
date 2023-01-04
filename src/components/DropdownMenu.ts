import { Menu } from "obsidian";

export interface DropdownMenuOption {
    label: string;
    onClick: () => void;
}

export const showDropdownMenu = (options: DropdownMenuOption[], containerEl: HTMLElement) => {
    const menu = new Menu();

    options.forEach((opt: DropdownMenuOption) => {
        menu?.addItem((item) => {
            item
                .setTitle(opt.label)
                .onClick(() => {
                    opt.onClick();
                })
        })
    })
    const parentPosition = containerEl.getBoundingClientRect();
    menu.showAtPosition({ x: parentPosition.left, y: parentPosition.bottom })
}



