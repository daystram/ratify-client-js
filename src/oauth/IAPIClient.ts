import { AxiosResponse } from "axios";

export interface IAPIClient {
  token: (tokenRequest: object) => Promise<AxiosResponse>;
  logout: (logoutRequest: object) => Promise<AxiosResponse>;
}
