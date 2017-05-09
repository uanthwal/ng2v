import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {Ng2vModule} from '@ng-bootstrap/ng-bootstrap';

import {DefaultComponent} from './default';
import {GettingStarted} from './getting-started';
import {AppComponent} from './app.component';
import {routing} from './app.routing';
import {Ng2vdDemoModule} from './components';
import {Ng2vdSharedModule} from './shared';

@NgModule({
  declarations: [
    AppComponent,
    DefaultComponent,
    GettingStarted
  ],
  imports: [
    BrowserModule,
    routing,
    Ng2vModule.forRoot(),
    Ng2vdDemoModule,
    Ng2vdSharedModule
  ],
  bootstrap: [AppComponent]
})
export class Ng2vdModule {
}