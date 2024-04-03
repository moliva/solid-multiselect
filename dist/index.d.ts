import { JSX, Setter } from 'solid-js';
import './MultiSelect.css';
export interface Ref<T> {
    values: () => T[];
}
export interface IMultiSelectProps<T> {
    ref: Setter<Ref<T>>;
    options: T[];
    disablePreSelectedValues?: boolean;
    selectedValues?: T[];
    isObject?: boolean;
    displayValue?: string;
    renderValue?: (option: T) => JSX.Element;
    showCheckbox?: boolean;
    selectionLimit?: number;
    placeholder?: string;
    groupBy?: string;
    style?: object;
    emptyRecordMsg?: string;
    onSelect?: (selectedList: T[], selectedItem: T) => void;
    onRemove?: (selectedList: T[], selectedItem: T) => void;
    onSearch?: (value: string) => void;
    closeIcon?: string;
    singleSelect?: boolean;
    caseSensitiveSearch?: boolean;
    id?: string;
    closeOnSelect?: boolean;
    avoidHighlightFirstOption?: boolean;
    hidePlaceholder?: boolean;
    showArrow?: boolean;
    keepSearchTerm?: boolean;
    disable?: boolean;
    loading?: boolean;
    loadingMessage?: string;
    customCloseIcon?: Element | string;
}
export declare function MultiSelect<T>(props: IMultiSelectProps<T>): JSX.Element;
export default MultiSelect;
