import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  ElementRef,
  EventEmitter,
  forwardRef,
  Injector,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {letProto} from 'rxjs/operator/let';
import {_do} from 'rxjs/operator/do';
import {fromEvent} from 'rxjs/observable/fromEvent';
import {positionElements} from '../util/positioning';
import {Ng2vTypeaheadWindow, ResultTemplateContext} from './typeahead-window';
import {PopupService} from '../util/popup';
import {toString, isDefined} from '../util/util';
import {Ng2vTypeaheadConfig} from './typeahead-config';

enum Key {
  Tab = 9,
  Enter = 13,
  Escape = 27,
  ArrowUp = 38,
  ArrowDown = 40
}

const NGB_TYPEAHEAD_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => Ng2vTypeahead),
  multi: true
};

/**
 * Payload of the selectItem event.
 */
export interface Ng2vTypeaheadSelectItemEvent {
  /**
   * An item about to be selected
   */
  item: any;

  /**
   * Function that will prevent item selection if called
   */
  preventDefault: () => void;
}

let nextWindowId = 0;

/**
 * Ng2vTypeahead directive provides a simple way of creating powerful typeaheads from any text input
 */
@Directive({
  selector: 'input[ng2vTypeahead]',
  host: {
    '(blur)': 'handleBlur()',
    '[class.open]': 'isPopupOpen()',
    '(document:click)': 'dismissPopup()',
    '(keydown)': 'handleKeyDown($event)',
    'autocomplete': 'off',
    'autocapitalize': 'off',
    'autocorrect': 'off',
    'role': 'combobox',
    'aria-multiline': 'false',
    '[attr.aria-autocomplete]': 'showHint ? "both" : "list"',
    '[attr.aria-activedescendant]': 'activeDescendant',
    '[attr.aria-owns]': 'isPopupOpen() ? popupId : null',
    '[attr.aria-expanded]': 'isPopupOpen()'
  },
  providers: [NGB_TYPEAHEAD_VALUE_ACCESSOR]
})
export class Ng2vTypeahead implements ControlValueAccessor,
    OnInit, OnDestroy {
  private _popupService: PopupService<Ng2vTypeaheadWindow>;
  private _subscription: Subscription;
  private _userInput: string;
  private _valueChanges: Observable<string>;
  private _windowRef: ComponentRef<Ng2vTypeaheadWindow>;
  private _zoneSubscription: any;


  /**
   * A flag indicating if model values should be restricted to the ones selected from the popup only.
   */
  @Input() editable: boolean;

  /**
   * A flag indicating if the first match should automatically be focused as you type.
   */
  @Input() focusFirst: boolean;

  /**
   * A function to convert a given value into string to display in the input field
   */
  @Input() inputFormatter: (value: any) => string;

  /**
   * A function to transform the provided observable text into the array of results.  Note that the "this" argument
   * is undefined so you need to explicitly bind it to a desired "this" target.
   */
  @Input() ng2vTypeahead: (text: Observable<string>) => Observable<any[]>;

  /**
   * A function to format a given result before display. This function should return a formatted string without any
   * HTML markup
   */
  @Input() resultFormatter: (value: any) => string;

  /**
   * A template to override a matching result default display
   */
  @Input() resultTemplate: TemplateRef<ResultTemplateContext>;

  /**
   * Show hint when an option in the result list matches.
   */
  @Input() showHint: boolean;

  /**
   * An event emitted when a match is selected. Event payload is of type Ng2vTypeaheadSelectItemEvent.
   */
  @Output() selectItem = new EventEmitter<Ng2vTypeaheadSelectItemEvent>();

  activeDescendant: string;
  popupId = `ng2v-typeahead-${nextWindowId++}`;

  private _onTouched = () => {};
  private _onChange = (_: any) => {};

  constructor(
      private _elementRef: ElementRef, private _viewContainerRef: ViewContainerRef, private _renderer: Renderer2,
      private _injector: Injector, componentFactoryResolver: ComponentFactoryResolver, config: Ng2vTypeaheadConfig,
      ngZone: NgZone) {
    this.editable = config.editable;
    this.focusFirst = config.focusFirst;
    this.showHint = config.showHint;

    this._valueChanges = fromEvent(_elementRef.nativeElement, 'input', ($event) => $event.target.value);

    this._popupService = new PopupService<Ng2vTypeaheadWindow>(
        Ng2vTypeaheadWindow, _injector, _viewContainerRef, _renderer, componentFactoryResolver);

    this._zoneSubscription = ngZone.onStable.subscribe(() => {
      if (this.isPopupOpen()) {
        positionElements(this._elementRef.nativeElement, this._windowRef.location.nativeElement, 'bottom-left');
      }
    });
  }

  ngOnInit(): void {
    const inputValues$ = _do.call(this._valueChanges, value => {
      this._userInput = value;
      if (this.editable) {
        this._onChange(value);
      }
    });
    const results$ = letProto.call(inputValues$, this.ng2vTypeahead);
    const userInput$ = _do.call(results$, () => {
      if (!this.editable) {
        this._onChange(undefined);
      }
    });
    this._subscription = this._subscribeToUserInput(userInput$);
  }

  ngOnDestroy(): void {
    this._unsubscribeFromUserInput();
    this._zoneSubscription.unsubscribe();
  }

  registerOnChange(fn: (value: any) => any): void { this._onChange = fn; }

  registerOnTouched(fn: () => any): void { this._onTouched = fn; }

  writeValue(value) { this._writeInputValue(this._formatItemForInput(value)); }

  setDisabledState(isDisabled: boolean): void {
    this._renderer.setProperty(this._elementRef.nativeElement, 'disabled', isDisabled);
  }

  dismissPopup() {
    if (this.isPopupOpen()) {
      this._closePopup();
      this._writeInputValue(this._userInput);
    }
  }

  isPopupOpen() { return this._windowRef != null; }

  handleBlur() { this._onTouched(); }

  handleKeyDown(event: KeyboardEvent) {
    if (!this.isPopupOpen()) {
      return;
    }

    if (Key[toString(event.which)]) {
      switch (event.which) {
        case Key.ArrowDown:
          event.preventDefault();
          this._windowRef.instance.next();
          this._showHint();
          break;
        case Key.ArrowUp:
          event.preventDefault();
          this._windowRef.instance.prev();
          this._showHint();
          break;
        case Key.Enter:
        case Key.Tab:
          const result = this._windowRef.instance.getActive();
          if (isDefined(result)) {
            event.preventDefault();
            event.stopPropagation();
            this._selectResult(result);
          }
          this._closePopup();
          break;
        case Key.Escape:
          event.preventDefault();
          this.dismissPopup();
          break;
      }
    }
  }

  private _openPopup() {
    if (!this.isPopupOpen()) {
      this._windowRef = this._popupService.open();
      this._windowRef.instance.id = this.popupId;
      this._windowRef.instance.selectEvent.subscribe((result: any) => this._selectResultClosePopup(result));
      this._windowRef.instance.activeChangeEvent.subscribe((activeId: string) => this.activeDescendant = activeId);
    }
  }

  private _closePopup() {
    this._popupService.close();
    this._windowRef = null;
    this.activeDescendant = undefined;
  }

  private _selectResult(result: any) {
    let defaultPrevented = false;
    this.selectItem.emit({item: result, preventDefault: () => { defaultPrevented = true; }});

    if (!defaultPrevented) {
      this.writeValue(result);
      this._onChange(result);
    }
  }

  private _selectResultClosePopup(result: any) {
    this._selectResult(result);
    this._closePopup();
  }

  private _showHint() {
    if (this.showHint) {
      const userInputLowerCase = this._userInput.toLowerCase();
      const formattedVal = this._formatItemForInput(this._windowRef.instance.getActive());

      if (userInputLowerCase === formattedVal.substr(0, this._userInput.length).toLowerCase()) {
        this._writeInputValue(this._userInput + formattedVal.substr(this._userInput.length));
        this._elementRef.nativeElement['setSelectionRange'].apply(
            this._elementRef.nativeElement, [this._userInput.length, formattedVal.length]);
      } else {
        this.writeValue(this._windowRef.instance.getActive());
      }
    }
  }

  private _formatItemForInput(item: any): string {
    return item && this.inputFormatter ? this.inputFormatter(item) : toString(item);
  }

  private _writeInputValue(value: string): void {
    this._renderer.setProperty(this._elementRef.nativeElement, 'value', value);
  }

  private _subscribeToUserInput(userInput$: Observable<any[]>): Subscription {
    return userInput$.subscribe((results) => {
      if (!results || results.length === 0) {
        this._closePopup();
      } else {
        this._openPopup();
        this._windowRef.instance.focusFirst = this.focusFirst;
        this._windowRef.instance.results = results;
        this._windowRef.instance.term = this._elementRef.nativeElement.value;
        if (this.resultFormatter) {
          this._windowRef.instance.formatter = this.resultFormatter;
        }
        if (this.resultTemplate) {
          this._windowRef.instance.resultTemplate = this.resultTemplate;
        }
        this._showHint();

        // The observable stream we are subscribing to might have async steps
        // and if a component containing typeahead is using the OnPush strategy
        // the change detection turn wouldn't be invoked automatically.
        this._windowRef.changeDetectorRef.detectChanges();
      }
    });
  }

  private _unsubscribeFromUserInput() {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
    this._subscription = null;
  }
}