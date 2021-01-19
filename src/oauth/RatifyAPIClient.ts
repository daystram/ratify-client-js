import axios, { AxiosInstance, AxiosResponse } from "axios";
import qs from "qs";
import { IAPIClient } from "./IAPIClient";

export class RatifyAPIClient implements IAPIClient {
  private apiClient: AxiosInstance;
  constructor(issuer: string) {
    this.apiClient = axios.create({
      baseURL: `${issuer}/oauth/`,
    });
  }

  token(tokenRequest: object): Promise<AxiosResponse> {
    return this.apiClient.post(`token`, qs.stringify(tokenRequest), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  logout(logoutRequest: object): Promise<AxiosResponse> {
    return this.apiClient.post(`logout`, qs.stringify(logoutRequest), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }
}
