import {Injectable} from '@angular/core';

/**
 * Configuration service for the Ng2vTimepicker component.
 * You can inject this service, typically in your root component, and customize the values of its properties in
 * order to provide default values for all the timepickers used in the application.
 */
@Injectable()
export class Ng2vTimepickerConfig {
  meridian = false;
  spinners = true;
  seconds = false;
  hourStep = 1;
  minuteStep = 1;
  secondStep = 1;
  disabled = false;
  readonlyInputs = false;
  size: 'small' | 'medium' | 'large' = 'medium';
}
