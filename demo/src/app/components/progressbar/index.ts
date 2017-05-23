export * from './progressbar.component';

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {Ng2vdSharedModule} from '../../shared';
import {Ng2vdComponentsSharedModule} from '../shared';
import {Ng2vdProgressbar} from './progressbar.component';
import {DEMO_DIRECTIVES} from './demos';

@NgModule({
  imports: [Ng2vdSharedModule, Ng2vdComponentsSharedModule],
  exports: [Ng2vdProgressbar],
  declarations: [Ng2vdProgressbar, ...DEMO_DIRECTIVES]
})
export class Ng2vdProgressbarModule {}
