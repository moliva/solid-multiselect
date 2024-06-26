import { createEffect, createSignal, mergeProps, splitProps, onMount, Show, For, JSX, Setter } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import './MultiSelect.css'

const DownArrow = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Angle_down_font_awesome.svg/1200px-Angle_down_font_awesome.svg.png'

type InternalInputEvent =  InputEvent & {
    currentTarget: HTMLInputElement;
    target: HTMLInputElement;
}

type InternalKeyboardEvent = KeyboardEvent & {
    currentTarget: HTMLInputElement;
    target: Element;
}

const defaultProps = {
    emptyRecordMsg: 'No records found',
    options: [],
    selectedValues: [],
    showArrow: false,
    singleSelect: false,
    style: {},
    placeholder: 'select',
    groupBy: '',
    disable: false,
    onSelect: () => {},
    onRemove: () => {}
}

export interface Ref<T> {
    values: () => T[]
}

export interface IMultiSelectProps<T> {
    ref: Setter<Ref<T>>
    options: T[];
    disablePreSelectedValues?: boolean;
    selectedValues?: T[];
    isObject?: boolean;
    displayValue?: string;
    renderValue?: (option: T) => JSX.Element
    showCheckbox?: boolean;
    selectionLimit?: number;
    placeholder?: string;
    groupBy?: string;
    style?: object;
    emptyRecordMsg?: string;
    onSelect?: (selectedList: T[], selectedItem: T) => void;
    onRemove?: (selectedList: T[], selectedItem: T) => void;
    onSearch?: (value:string) => void;
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

export function MultiSelect<T> (props: IMultiSelectProps<T>) {
    props = mergeProps(defaultProps, props)

    const [local] = splitProps(props, ['placeholder', 'style', 'singleSelect', 'id', 'hidePlaceholder', 'disable', 'showArrow', 'avoidHighlightFirstOption'])
    const { placeholder, style, singleSelect, id, hidePlaceholder, disable, showArrow, avoidHighlightFirstOption } = local

    const [toggleOptionsList, setToggleOptionsList] = createSignal(false)
    const [highlightOption, setHighlightOption] = createSignal(avoidHighlightFirstOption ? -1 : 0)
    const [inputValue, setInputValue] = createSignal('')
    const [options, setOptions] = createSignal<T[]>(props.options)
    const [filteredOptions, setFilteredOptions] = createSignal(props.options)
    const [unfilteredOptions, setUnfilteredOptions] = createSignal(props.options)
    const [selectedValues, setSelectedValues] = createSignal<T[]>(Object.assign([], props.selectedValues))
    const [preSelectedValues, setPreSelectedValues] = createSignal(Object.assign([], props.selectedValues))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [keepSearchTerm, setKeepSearchTerm] = createSignal(props.keepSearchTerm)
    const [groupedObject, setGroupedObject] = createSignal([])

    onMount(() => {
      if (props.ref) {
        props.ref({
          values: selectedValues
        })
      }
    })

    let optionTimeout: number
    let searchBox: HTMLInputElement
    const searchWrapper = (el: HTMLDivElement) => el.addEventListener('click', listenerCallback)

    function renderGroupByOptions () {
        const isObject = props.isObject || false
        const renderValue = props.renderValue
        const showCheckbox = props.showCheckbox
        const style = props.style
        const singleSelect = props.singleSelect
        const groupedObjectKeys  = Object.keys(groupedObject())

        return (
            <For each={groupedObjectKeys}>
                {(objKey) =>
                    <>
                        <li class="groupHeading" style={style['groupHeading']}>{objKey}</li>
                        <For each={groupedObject()[objKey]}>
                            {(option: T) =>
                                <li
                                    style={style['option']}
                                    class="groupChildEle option"
                                    classList={{ disableSelection: fadeOutSelection(option) || isDisablePreSelectedValues(option) }}
                                    onClick={onSelectItem(option)}
                                >
                                    <Show when= {showCheckbox && !singleSelect} >
                                        <input
                                            type="checkbox"
                                            class="checkbox"
                                            readOnly
                                            checked={isSelectedValue(option)}
                                        />
                                    </Show>
                                    {
                                        isObject ? (
                                            <Dynamic component={() => renderValue(option)} />
                                        ) : (option || '').toString()
                                    }
                                </li>
                            }
                        </For>
                    </>
                }
            </For>
        )
    }

    const isSelectedValue = (item: T) => {
        if (props.isObject) {
            return (
                selectedValues().filter((i: T) => i[props.displayValue] === item[props.displayValue])
                    .length > 0
            )
        }
        return selectedValues().filter(i => i === item).length > 0
    }

    const fadeOutSelection = (item: T) => {
        if (props.singleSelect) {
            return
        }
        if (props.selectionLimit == -1) {
            return false
        }
        if (props.selectionLimit != selectedValues().length) {
            return false
        }
        if (props.selectionLimit == selectedValues().length) {
            if (!props.showCheckbox) {
                return true
            } else {
                if (isSelectedValue(item)) {
                    return false
                }
                return true
            }
        }
    }

    const isDisablePreSelectedValues = (value: T) => {
        if (!props.disablePreSelectedValues || !preSelectedValues().length) {
            return false
        }
        if (props.isObject) {
            return (
                preSelectedValues().filter(i => i[props.displayValue] === value[props.displayValue])
                    .length > 0
            )
        }
        return preSelectedValues().filter(i => i === value).length > 0
    }

    const removeSelectedValuesFromOptions = (skipCheck: boolean) => {
        if (!skipCheck && props.groupBy) {
            groupByOptions(options())
        }
        if (!selectedValues().length && !skipCheck) {
            return
        }
        if (props.isObject) {
            const optionList = unfilteredOptions().filter(item => {
                return selectedValues().findIndex(
                    v => v[props.displayValue] === item[props.displayValue]
                ) === -1
                    ? true
                    : false
            })
            if (props.groupBy) {
                groupByOptions(optionList)
            }
            setOptions(optionList)
            setFilteredOptions(optionList)
            // TODO: Fix wait
            setTimeout(() => {
                filterOptionsByInput()
            }, 0)
            return
        }
        const optionList = unfilteredOptions().filter(
            item => selectedValues().indexOf(item) === -1
        )

        setOptions(optionList)
        setFilteredOptions(optionList)
        // TODO: Fix wait
        setTimeout(() => {
            filterOptionsByInput()
        }, 0)
    }

    const initialSetValue = () => {
        if (!props.showCheckbox && !props.singleSelect) {
            removeSelectedValuesFromOptions(false)
        }

        if (props.groupBy) {
            groupByOptions(options())
        }
    }

    createEffect((prevOptions) => {
        if (JSON.stringify(prevOptions) !== JSON.stringify(props.options)) {
            setOptions(props.options)
            setFilteredOptions(props.options)
            setUnfilteredOptions(props.options)
            // TODO: Fix wait
            setTimeout(() => {
                initialSetValue()
            }, 0)
        }
        return props.options
    }, props.options)

    createEffect((prevSelectedValues) => {
        if (JSON.stringify(prevSelectedValues) !== JSON.stringify(props.selectedValues)) {
            setSelectedValues(Object.assign([], props.selectedValues))
            setPreSelectedValues(Object.assign([], props.selectedValues))
            // TODO: Fix wait
            setTimeout(() => {
                initialSetValue()
            }, 0)
        }
        return props.selectedValues
    }, props.selectedValues)

    onMount(() => {
        initialSetValue()
    })

    const onSingleSelect = (item: T) => {
        setSelectedValues([item])
        setToggleOptionsList(false)
    }

    const onRemoveSelectedItem = (item: T) => {
        let index = 0
        const newSelectedValues = [...selectedValues()]
        if (props.isObject) {
            index = newSelectedValues.findIndex(
                i => i[props.displayValue] === item[props.displayValue]
            )
        } else {
            index = newSelectedValues.indexOf(item)
        }
        newSelectedValues.splice(index, 1)
        setSelectedValues(newSelectedValues)
        props.onRemove(newSelectedValues, item)
        if (!props.showCheckbox) {
            removeSelectedValuesFromOptions(true)
        }
        if (!props.closeOnSelect) {
            searchBox.focus()
        }
    }

    const onSelectItem = (item: T) => () => {
        if (!keepSearchTerm) {
            setInputValue('')
        }
        if (singleSelect) {
            onSingleSelect(item)
            props.onSelect([item], item)
            setInputValue('')
            return
        }
        if (isSelectedValue(item)) {
            onRemoveSelectedItem(item)
            return
        }
        if (props.selectionLimit == selectedValues().length) {
            return
        }

        const newValuesSelected: T[] = [...selectedValues(), item]

        setSelectedValues(newValuesSelected)
        props.onSelect(newValuesSelected, item)

        if (!props.showCheckbox) {
            removeSelectedValuesFromOptions(true)
        } else {
            filterOptionsByInput()
        }

        if (!props.closeOnSelect) {
            searchBox.focus()
        }
    }

    function renderNormalOption () {
        return (
            <For each={ options() } fallback={
                <span style={props.style['notFound']} class="notFound">
                    {props.emptyRecordMsg ?? 'No Options Available'}
                </span>
            }>
                {(option, index) =>
                    <li
                        style={props.style['option']}
                        class= "option"
                        classList={{
                            'disableSelection': fadeOutSelection(option),
                            'highlightOption highlight': highlightOption() === index()
                        }}
                        onClick={onSelectItem(option)}
                    >
                        <Show when={props.showCheckbox && !props.singleSelect}>
                            <input
                                type="checkbox"
                                readOnly
                                class="checkbox"
                                checked={isSelectedValue(option)}
                            />
                        </Show>
                        <Show when={props.isObject} fallback={(option || '').toString()}>
                              <Dynamic component={() => props.renderValue!(option)} />
                        </Show>
                    </li>}
            </For>
        )
    }

    function renderOptionList () {
        const loadingMessage = props.loadingMessage ?? 'loading...'

        if (props.loading) {
            return (
                <ul class="optionContainer" style={props.style['optionContainer']}>
                    <Show when={typeof loadingMessage === 'string'} fallback={loadingMessage}>
                        <span class="notFound" style={props.style['loadingMessage']}>{loadingMessage}</span>
                    </Show>
                </ul>
            )
        }

        return (
            <ul class="optionContainer" style={props.style['optionContainer']}>
                {!props.groupBy ? renderNormalOption() : renderGroupByOptions()}
            </ul>
        )
    }

    const listenerCallback = () => {
        searchBox.focus()
    }

    const toggleOptionList = () => {
        setToggleOptionsList(!toggleOptionsList())
        setHighlightOption(avoidHighlightFirstOption ? -1 : 0)
    }

    const matchValues = (value: string, search: string) => {
        if (props.caseSensitiveSearch) {
            return value.indexOf(search) > -1
        }

        if (value.toLowerCase) {
            return value.toLowerCase().indexOf(search.toLowerCase()) > -1
        }

        return value.toString().indexOf(search) > -1
    }

    const filterOptionsByInput = () => {
        let newOptions: T[]
        if (props.isObject) {
            newOptions = filteredOptions().filter(option => matchValues(option[props.displayValue], inputValue()))
        } else {
            newOptions = filteredOptions().filter(option => matchValues(option.toString(), inputValue()))
        }

        groupByOptions(newOptions)
        setOptions(newOptions)
    }

    const groupByOptions = (options: T[]) => {
        const groupBy = props.groupBy
        const groupedObject = options.reduce(function (r, a) {
            const key = a[groupBy] || 'Others'
            r[key] = r[key] || []
            r[key].push(a)

            return r
        }, Object.create({}))

        setGroupedObject(groupedObject)
    }

    const onInput = (event: InternalInputEvent) => {
        if (singleSelect) {
            setSelectedValues([])
        }

        setInputValue(event.target.value)
        // TODO: Fix wait setInputValue
        setTimeout(() => {
            filterOptionsByInput()
        }, 0)

        if (props.onSearch) {
            props.onSearch(event.target.value)
        }
    }

    const onFocus = () => {
        if (singleSelect) {
            setOptions(props.options)
        }
        if (toggleOptionsList()) {
            clearTimeout(optionTimeout)
        } else {
            toggleOptionList()
        }
    }

    const onBlur = () => {
        if (toggleOptionsList()) {
            optionTimeout = setTimeout(() => setToggleOptionsList(false), 150)
            if (singleSelect) {
                setInputValue('')
            }
        }
    }

    const onArrowKeyNavigation = (e: InternalKeyboardEvent) => {
        if (e.code === 'Backspace' && !inputValue() && !props.disablePreSelectedValues && selectedValues().length) {
            const values = selectedValues()
            onRemoveSelectedItem(values[values.length - 1 ])
        }
        if (!options().length) {
            return
        }
        if (e.code === 'ArrowUp') {
            if (highlightOption() > 0) {
                setHighlightOption((previousState) => previousState - 1)
            } else {
                setHighlightOption(options().length - 1)
            }
        } else if (e.code === 'ArrowDown') {
            if (highlightOption() < options().length - 1) {
                setHighlightOption((previousState) => previousState + 1)
            } else {
                setHighlightOption(0)
            }
        } else if (e.code === 'Enter' && options().length && toggleOptionsList()) {
            if (highlightOption() === -1) {
                return
            }
            onSelectItem(options()[highlightOption()])()
        }
    }

    function renderSelectedList () {
        return  (
            <For each={selectedValues()}>
                { (value) =>
                    <span
                        class="chip"
                        classList={{
                            singleChip: props.singleSelect,
                            disableSelection: isDisablePreSelectedValues(value)
                        }}
                        style={props.style['chips']}
                    >
                        {!props.isObject ? (value || '').toString() : <Dynamic component={() => props.renderValue!(value)} />}
                        <Show when={!isDisablePreSelectedValues(value)}>
                            <Show when={!props.customCloseIcon}
                                fallback={<i class="custom-close" onClick={() => onRemoveSelectedItem(value)}>{props.customCloseIcon}</i>}
                            >
                                <span class="icon_cancel closeIcon" onClick={() => onRemoveSelectedItem(value)}>⨯</span>
                            </Show>
                        </Show>
                    </span>}
            </For>
        )
    }

    function renderMultiSelectContainer () {
        return (
            <div class="multiSelect-container multiSelectContainer"
                classList={{ disable_ms: disable }}
                id={id || 'multiSelectContainerSolid'}
                style={style['multiSelectContainer']}
            >
                <div class="search-wrapper searchWrapper"
                    classList={{ singleSelect }}
                    ref={searchWrapper} style={style['searchBox']}
                >
                    {renderSelectedList()}
                    <input
                        type="text"
                        ref={searchBox}
                        class="searchBox"
                        classList={{ searchSingle: singleSelect }}
                        id={`${id || 'search'}_input`}
                        onInput={ onInput}
                        value={inputValue()}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        placeholder={((singleSelect && selectedValues().length) || (hidePlaceholder && selectedValues().length)) ? '' : placeholder}
                        onKeyDown={onArrowKeyNavigation}
                        style={style['inputField']}
                        autocomplete="off"
                        disabled={disable}
                    />
                    <Show when={(singleSelect || showArrow)}>
                        <img class="icon_cancel icon_down_dir" src={DownArrow} />
                    </Show>
                </div>
                <div class="optionListContainer"
                    classList={{ displayBlock : toggleOptionsList(), displayNone: !toggleOptionsList() }}
                >
                    {renderOptionList()}
                </div>
            </div>
        )
    }

    return renderMultiSelectContainer()
}

export default MultiSelect
