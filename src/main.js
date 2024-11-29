import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
import PrimeVue from "primevue/config";
import router from "./router";
import { config } from "./config";
import ToastService from "primevue/toastservice";
import Nora from "@primevue/themes/nora";
import ConfirmationService from 'primevue/ConfirmationService'

const app = createApp(App);

app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Nora
  ,
  },
  locale: {
    firstDayOfWeek: 1,
    dayNames: [
      "domingo",
      "lunes",
      "martes",
      "miércoles",
      "jueves",
      "viernes",
      "sábado",
    ],
    dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
    dayNamesMin: ["D", "L", "M", "X", "J", "V", "S"],
    monthNames: [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ],
    monthNamesShort: [
      "ene",
      "feb",
      "mar",
      "abr",
      "may",
      "jun",
      "jul",
      "ago",
      "sep",
      "oct",
      "nov",
      "dic",
    ],
    today: "Hoy",
    clear: "Limpiar",
    dateFormat: "yy/mm/dd",
    weekHeader: "Sm",
  },
});
app.use(ToastService);
app.use(ConfirmationService)

//Configuracion de la direccion al endpoint del servicio
let bes = config.gateway_svc;
app.config.globalProperties.$svc = `${bes.protocol}://${bes.hostname}:${bes.port}`;
app.config.globalProperties.$exitcode = config.exit_code;

app.mount("#app");
