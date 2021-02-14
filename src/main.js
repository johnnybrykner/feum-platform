import Vuex from "vuex";
import DefaultLayout from "@/layouts/Default.vue";
import "@/assets/reset.css";
import "@/assets/fonts.css";
import "@/assets/style.scss";

export default function (Vue, { appOptions }) {
  Vue.component("Layout", DefaultLayout);
  Vue.use(Vuex);

  appOptions.store = new Vuex.Store({
    state: {
      message: "",
      participantAmount: 0,
      loading: false,
      userName: null,
      userEmail: null,
      userPhone: null,
    },
    mutations: {
      setMessageText(state, message) {
        state.message = message;
      },
      resetMessageText(state) {
        state.message = "";
      },
      setCurrentParticipantAmount(state, amount) {
        state.participantAmount = amount;
      },
      setLoading(state, setTo) {
        state.loading = setTo;
      },
      setUserData(state, userData) {
        state.userName = userData.userName;
        state.userEmail = userData.userEmail;
        state.userPhone = userData.userPhone;
      },
    },
    getters: {
      hasTicketsLeft(state) {
        return (
          Number(process.env.GRIDSOME_EVENT_CAPACITY) > state.participantAmount
        );
      },
      getMessage(state) {
        return state.message;
      },
      isLoading(state) {
        return state.loading;
      },
      hasPersistedData(state) {
        return !!state.userName && !!state.userEmail && !!state.userPhone;
      },
    },
    actions: {
      async checkParticipantAmount({ commit, dispatch }) {
        const rawData = await fetch(
          `${process.env.GRIDSOME_API_URL}.netlify/functions/get-current-user-amount`
        );
        if (rawData.status !== 200) {
          dispatch(
            "displayMessage",
            "There has been an error, please try again later."
          );
          return;
        }
        const response = await rawData.json();
        commit("setCurrentParticipantAmount", Number(response));
      },
      async sendConfirmationEmail({ dispatch }, participantInfo) {
        const rawData = await fetch(
          `${process.env.GRIDSOME_API_URL}.netlify/functions/send-confirmation-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              participantId: participantInfo.participantId,
              contactEmail: participantInfo.email,
              contactName: participantInfo.name,
            }),
          }
        );
        await dispatch("checkParticipantAmount");
        dispatch("displayMessage", await rawData.text());
      },
      displayMessage({ commit }, messageText) {
        commit("setMessageText", messageText);
        commit("setLoading", false);

        setTimeout(() => commit("resetMessageText"), 5000);
      },
      persistUserData({ commit }, userData) {
        commit("setUserData", userData);
      },
    },
  });
}
