import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ReplaySubject } from 'rxjs';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  web3Provider: any = null;

  onAccountChange$: ReplaySubject<string | null> = new ReplaySubject(1);

  _connectedAccount: string | null = null;
  set connectedAccount(account: string | null) {
    const changed = this._connectedAccount !== account;
    if (!changed) {
      return;
    }

    if (account) {
      sessionStorage.setItem("eth_conn", "1");
    } else {
      sessionStorage.removeItem("eth_conn");
    }

    this._connectedAccount = account;
    this.onAccountChange$.next(account);
  }

  get connectedAccount() {
    return this._connectedAccount;
  }

  constructor(
    private alert: AlertService,
    private router: Router
  ) { }

  handleError(err: string) {
    this.alert.error(err);
    this.router.navigate(["/"])
  }

  _checkChain(chainId: number) {
    return chainId === 137
  }

  handleEthereum() {
    this.connectedAccount = null;
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      this.web3Provider = ethereum;

      try {
        // Request account access
        this.web3Provider.request({ method: 'eth_requestAccounts' }).then((accounts: any) => {
          this.connectedAccount = accounts[0];
        });

        this.web3Provider.on('accountsChanged', (accounts: any) => {
          this.connectedAccount = accounts[0];
          setTimeout(() => {
            window.location.reload();
          }, 100)
        });

        this.web3Provider.on('chainChanged', (chainId: any) => {
          if (!this._checkChain(parseInt(chainId, 16))) {
            setTimeout(() => {
              window.location.reload();
            }, 100)
            return;
          }
        });

        /*setTimeout(() => {
          if (!this._checkChain(parseInt(ethereum.chainId, 16))) {
            this.connectedAccount = null;
            this.handleError("Please connect to Polygon");
          }
        }, 100);*/
      } catch (error) {
        this.connectedAccount = null;
        this.handleError("Couldn't connect to MetaMask");
      }
      return;
    } else {
      this.handleError("Couldn't connect to MetaMask");
      return;
    }
  }


  connectToMetaMask() {
    if ((window as any).ethereum) {
      this.handleEthereum();
    } else {
      window.addEventListener('ethereum#initialized', this.handleEthereum.bind(this), {
        once: true,
      });
      // If the event is not dispatched by the end of the timeout,
      // the user probably doesn't have MetaMask installed.
      setTimeout(this.handleEthereum.bind(this), 3000); // 3 seconds
    }
  }

  async signMessage(msg: string) {
    if (!msg) {
      return Promise.reject();
    }

    if (!(this.web3Provider && this.connectedAccount)) {
      this.alert.error("Couldn't sign message");
      return await Promise.reject();
    }

    return await this.web3Provider.request({
      method: 'personal_sign',
      params: [
        msg,
        this.connectedAccount
      ],
    });
  }

  disconnectFromMetaMask() {
    this.connectedAccount = null;
    this.web3Provider = null;
  }
}
