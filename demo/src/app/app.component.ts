import {Component, OnInit} from '@angular/core';
import {Analytics} from './shared/analytics/analytics';
import {componentsList, cssElementsList} from './shared';

import '../style/app.scss';

@Component({
  selector: 'ng2vd-app',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  navbarCollapsed = true;

  components = componentsList;
  cssElements = cssElementsList;
  
  constructor(private _analytics: Analytics) {
  }

  ngOnInit(): void {
    this._analytics.trackPageViews();
  }
}
