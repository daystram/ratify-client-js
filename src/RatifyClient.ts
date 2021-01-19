import qs from "qs";
import pkceChallenge from "pkce-challenge";
import { v4 as uuidv4 } from "uuid";
import { AxiosResponse } from "axios";
import jwtDecode from "jwt-decode";
import { IAPIClient } from "./oauth/IAPIClient";
import { ITokenStorage } from "./storage/ITokenStorage";
import { User } from "./User";
import { RatifyAPIClient } from "./oauth/RatifyAPIClient";
import {
  ACCESS_TOKEN,
  ID_TOKEN,
  EXPIRE_DATE,
  KEY_TOKEN,
  KEY_STATE,
  KEY_CODE,
} from "./constants";

export interface RatifyClientOptions {
  clientId: string;
  redirectUri: string;
  issuer: string;
  storage: ITokenStorage;
}

export class RatifyClient {
  private options: RatifyClientOptions;
  private storageManager: ITokenStorage;
  private oauth: IAPIClient;

  constructor(opts: RatifyClientOptions) {
    this.options = opts;
    this.storageManager = opts.storage;
    this.oauth = new RatifyAPIClient(this.options.issuer);
  }

  isAuthenticated(): boolean {
    return this.getToken(ACCESS_TOKEN) !== "" && this._accessTokenValid();
  }

  _accessTokenValid(): boolean {
    return new Date(this.getToken(EXPIRE_DATE)) > new Date();
  }

  getToken(tokenKey: string): string {
    return (
      JSON.parse(this.storageManager.getItem(KEY_TOKEN) || "{}")[tokenKey] || ""
    );
  }

  getUser(): User | null {
    if (this.isAuthenticated()) return jwtDecode(this.getToken(ID_TOKEN));
    return null;
  }

  reset() {
    this.storageManager.removeItem(KEY_TOKEN);
  }

  authorize(immediate?: boolean, scopes?: string[]): void {
    window.location.href = `${this.options.issuer}/authorize?${qs.stringify({
      /* eslint-disable @typescript-eslint/camelcase */
      client_id: this.options.clientId,
      response_type: "code",
      redirect_uri: this.options.redirectUri,
      scope:
        "openid profile" + (scopes || []).map((scope) => " " + scope).join(""),
      state: this.getState(),
      code_challenge: this.getCodeChallenge(),
      code_challenge_method: "S256",
      immediate: immediate || false,
      /* eslint-enable @typescript-eslint/camelcase */
    })}`;
  }

  redeemToken(authorizationCode: string): Promise<AxiosResponse> {
    return this.oauth
      .token({
        /* eslint-disable @typescript-eslint/camelcase */
        client_id: this.options.clientId,
        grant_type: "authorization_code",
        code: authorizationCode,
        code_verifier: this.getCodeVerifier(),
        /* eslint-enable @typescript-eslint/camelcase */
      })
      .then((response) => {
        response.data[EXPIRE_DATE] = new Date(
          new Date().getTime() + response.data.expires_in * 1000
        );
        this.storageManager.setItem(KEY_TOKEN, JSON.stringify(response.data));
        return response;
      });
  }

  logout(global?: boolean) {
    return this.oauth
      .logout({
        /* eslint-disable @typescript-eslint/camelcase */
        access_token: this.getToken(ACCESS_TOKEN),
        client_id: this.options.clientId,
        global: global || false,
        /* eslint-enable @typescript-eslint/camelcase */
      })
      .then(() => {
        this.reset();
      })
      .catch(() => {
        this.reset();
      });
  }

  getState(): string {
    const state = uuidv4();
    sessionStorage.setItem(KEY_STATE, state);
    return state;
  }

  checkState(state: string): boolean {
    const temp = sessionStorage.getItem(KEY_STATE);
    sessionStorage.removeItem(KEY_STATE);
    return temp === state;
  }

  getCodeChallenge() {
    const pkce = pkceChallenge();
    sessionStorage.setItem(KEY_CODE, JSON.stringify(pkce));
    return pkce.code_challenge;
  }

  getCodeVerifier() {
    const pkce = JSON.parse(sessionStorage.getItem(KEY_CODE) || "");
    sessionStorage.removeItem(KEY_CODE);
    return pkce.code_verifier;
  }
}
