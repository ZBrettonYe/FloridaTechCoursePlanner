import { Component, OnInit, Input, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { MessageBusService } from '../message-bus.service';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { FormControl } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { SectionTableFilterValue } from '../section-table-card/section-table-card.component';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-section-filter-option',
  templateUrl: './section-filter-option.component.html',
  styleUrls: ['./section-filter-option.component.css'],
  animations: [
    trigger('highlight', [
      state('start', style({ backgroundColor: 'rgba(70, 160, 73, 0.2)' })),
      state('stop', style({ backgroundColor: 'rgba(70, 160, 73, 0)' })),
      transition('start => stop', [animate('0.5s')])
    ])
  ]
})
export class SectionFilterOptionComponent implements OnInit, OnDestroy {
  private readonly TOPICS = MessageBusService.TOPICS.SectionFilterOptionComponent;
  private readonly SUBSCRIPTIONS: (Subscription | undefined)[] = [];

  @Input() config: SectionFilterOptionConfig;

  @ViewChild('formFieldInput') formFieldInput: ElementRef;
  @ViewChild(MatSlideToggle) slideToggle: MatSlideToggle;

  formControl = new FormControl();
  filteredOptions: Observable<string[]>;
  highlightState = 'stop';

  constructor(
    private messageBus: MessageBusService
  ) {
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      MessageBusService.TOPICS.SectionTableCardComponent.click,
      this.setInputValue.bind(this)
    ));
    this.SUBSCRIPTIONS.push(this.messageBus.on(
      MessageBusService.TOPICS.SectionFilterCardComponent.resetFilters,
      this.reset.bind(this)
    ));
  }

  /**
   * Initialize auto complete and subscribe to updates.
   */
  ngOnInit(): void {
    // Initialize input form
    if (!this.config.checked) {
      this.formControl.disable();
    }
    this.formControl.setValue(this.config.inputValue);

    //
    this.filteredOptions = this.formControl.valueChanges.pipe(
      map(value => this.filter(value))
    );
    this.formControl.valueChanges.subscribe(this.valueChanges.bind(this));
  }

  ngOnDestroy() {
    for (const subscription of this.SUBSCRIPTIONS) {
      if (subscription) {
        subscription.unsubscribe();
      }
    }
  }

  slideToggleChange(checked: boolean) {
    this.config.checked = checked;
    checked ? this.formControl.enable() : this.formControl.disable();
    this.update();
  }

  valueChanges(value: string) {
    this.config.inputValue = value;
    this.update();
  }

  update() {
    this.messageBus.cast(this.TOPICS.update);
  }

  formFiledClick() {
    if (!this.config.checked) {
      this.slideToggleChange(true);
      (this.formFieldInput.nativeElement as HTMLElement).focus();
    }
  }

  filter(value: string) {
    value = value.toLowerCase();
    return this.config.options.filter(
      option => option.toLowerCase().includes(value)
    );
  }

  setInputValue(bundle: SectionTableFilterValue) {
    if (this.config.property !== bundle.property) {
      return;
    }

    this.slideToggleChange(true);
    this.formControl.setValue(bundle.value.toString());
    this.valueChanges(bundle.value.toString());

    this.triggerHighlight();
  }

  triggerHighlight() {
    this.highlightState = 'start';
    setTimeout((() => { this.highlightState = 'stop'; }).bind(this), 0);
  }

  reset() {
    if (this.config.checked || this.config.inputValue !== '') {
      this.triggerHighlight();
    }

    this.formControl.disable();
    this.config.checked = false;
    this.formControl.setValue('');
    this.config.inputValue = '';
    this.update();
  }
}

export interface SectionFilterOptionConfig {
  property: string;
  label: string;
  checked: boolean;
  options: string[];
  inputValue: string;
}
