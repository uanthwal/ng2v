import { Component } from '@angular/core';
import { Md2Toast } from 'ng2v';

@Component({
  selector: 'toast-demo',
  templateUrl: '../toast/toast-demo.html'
})
export class ToastDemo {
  constructor(private toast: Md2Toast) { }
  toastMe() {
    this.toast.toast('test message...');
  }
}
