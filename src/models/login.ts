// src/models/login.ts
import { createModel } from "@rematch/core";
import { RootModel } from "./index";

interface User {
  id: number;
  username: string;
  token: string;
}

interface LoginState {
  isLoggedIn: boolean;
  user: User | null;
  error: string | null;
  isLoading: boolean | undefined;
}

const login = createModel<RootModel>()({
  state: {
    isLoggedIn: false,
    user: null,
    error: null,
  } as LoginState,
  reducers: {
    startLoading(state: LoginState) {
      return { ...state, isLoading: true };
    },
    stopLoading(state: LoginState) {
      return { ...state, isLoading: false };
    },
    loginSuccess(state: LoginState, payload: User): LoginState {
      return {
        ...state,
        isLoggedIn: true,
        user: payload,
        error: null,
      };
    },
    loginFailure(state: LoginState, error: string): LoginState {
      return {
        ...state,
        isLoggedIn: false,
        user: null,
        error,
      };
    },
    logout(state: LoginState): LoginState {
      window.localStorage.setItem("token", "");
      return {
        ...state,
        isLoggedIn: false,
        user: null,
        error: null,
      };
    },
  },
  effects: (dispatch) => ({
    async loginUser({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) {
      dispatch.login.startLoading();
      try {
        let myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        const raw = JSON.stringify({ username, password });
        const response = await fetch("https://youtube-exam-service.onrender.com/login", {
          method: "POST",
          headers: myHeaders,
          body: raw,
        });

        const payload = await response.json();
        console.log(payload);
        if (response.status === 200) {
          dispatch.login.loginSuccess(payload.user);
          window.localStorage.setItem("token", payload.user.token);
        } else {
          dispatch.login.loginFailure("Invalid credentials");
        }
        dispatch.login.stopLoading();
      } catch (error) {
        dispatch.login.loginFailure("An error occurred");
        dispatch.login.stopLoading();
      }
    },
    async logoutUser() {
      dispatch.login.startLoading();
      try {
        let myHeaders = new Headers();
        myHeaders.append(
          "Authorization",
          `Bearer ${localStorage.getItem("token")}`
        );
        const response = await fetch("https://youtube-exam-service.onrender.com/logout", {
          method: "POST",
          headers: myHeaders,
        });

        if (response.status === 200) {
          dispatch.login.logout();
        } else {
          console.log("An error occurred");
        }

        dispatch.login.stopLoading();
      } catch (error) {
        console.log("An error occurred");
        dispatch.login.stopLoading();
      }
    },
    async getUser() {
      dispatch.login.startLoading();
      console.log('do getUser')
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          dispatch.login.stopLoading();

          return;
        }

        const response = await fetch("https://youtube-exam-service.onrender.com/user", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          const user = await response.json();
          dispatch.login.loginSuccess(user);
        } else {
          console.log("Token is invalid");
        }
        dispatch.login.stopLoading();
      } catch (error) {
        dispatch.login.stopLoading();

        console.log("Token is invalid");
      }
    },
  }),
});

export default login;
