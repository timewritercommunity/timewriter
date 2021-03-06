import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  onConnect$: ReplaySubject<boolean> = new ReplaySubject(1);
  onAccount$: ReplaySubject<string | null> = new ReplaySubject(1);

  connectedAccount: string | null = null;

  constructor(
    private auth: AuthService
  ) {
    this.auth.onAccountChange$.subscribe((account: string | null) => {
      this.onConnect$.next(!!account);
      this.onAccount$.next(account);

      this.connectedAccount = account;
    });
  }

  shortAddress(a: string | null): string {
    if (!a) {
      return "";
    }
    return `${a.substring(0, 4)}...${a.substring(a.length - 3)}`
  }

  async sign(msg: string) {
    return this.auth.signMessage(msg);
  }

  connect() {
    this.auth.connectToMetaMask();
  }

  disconnect() {
    this.auth.disconnectFromMetaMask();
  }
}
