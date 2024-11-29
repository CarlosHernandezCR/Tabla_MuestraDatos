let config = {
    Description: "Muestreo de unos datos por tabla paginada",
    gateway_svc:{
        protocol: "http",
        environment: "desa", //entorno de desarrollo
        hostname: "", //direccion del servicio
        port: "",  //puerto del servicio
    },
    timeoutInterval: 30000,
    exit_code: {
      200: "OK",
      404: "Not found",
      408: "Request timeout",
      500: "Server internal error",
    },
}
export {config}