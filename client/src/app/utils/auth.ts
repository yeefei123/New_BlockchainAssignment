import Cookies from "js-cookie";

const AUTH_COOKIE_NAME = "client_auth_token";
const EXPIRATION_HOURS = 1;

export const setAuthToken = (token: string) => {
  const expirationDate = new Date(
    new Date().getTime() + EXPIRATION_HOURS * 60 * 60 * 1000
  );
  Cookies.set(AUTH_COOKIE_NAME, token, { expires: expirationDate });
};

export const getAuthToken = () => {
  return Cookies.get(AUTH_COOKIE_NAME);
};

export const removeAuthToken = () => {
  Cookies.remove(AUTH_COOKIE_NAME);
};
