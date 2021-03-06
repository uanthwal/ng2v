import {Injectable} from '@angular/core';

/**
 * Configuration service for the Ng2vLoaderConfig component.
 * You can inject this service, typically in your root component, and customize the values of its properties in
 * order to provide default values for all the carousels used in the application.
 */
@Injectable()
export class Ng2vLoaderConfig {

  isLoading = true;
  isMask = false;
  maskLabel = 'Loading...';
  spinnerType = "";
}
