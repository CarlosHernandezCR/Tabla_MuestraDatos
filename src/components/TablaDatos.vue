<template>
  <div class="table-container">
    <Toast />
    <button v-if="limpiarBusqueda" @click="borrarBusqueda" class="limpiar-busqueda">
      Borrar busqueda
    </button>
    <DataTable
      :value="formattedDatos"
      resizableColumns
      showGridlines
      selectionMode="single"
      @rowSelect="onRowSelect"
      size="small"
      stripedRows
      scrollHeight="68vh"
      scrollable
      v-if="cargado"
    >
      <Column>
        <template #header>
          <span class="cabeceras">EDITAR</span> 
        </template>
        <template #body="slotProps">
          <button @click="handleEditClick(slotProps.rowData)" class="boton-editar"></button>
        </template>
      </Column>
      <Column>
        <template #header>
          <span class="cabeceras">ELIMINAR</span> 
        </template>
        <template #body="slotProps">
          <button @click="eliminar=true" class="boton-eliminar"></button>
        </template>
      </Column>
      <Column v-for="col in headers" :key="col.field" :field="col.field" :sortable="false">
        <template #header>
          <button @click.stop="abrirBusqueda(col.header, $event)" class="header-button">
            <span>&#x1F50D;&#xFE0E;</span>
          </button>
          <span class="cabeceras">
            {{ col.header }}
          </span>
          <button @click="orderBy(col.field)" class="header-button">
            {{ getIcono(col.field) }}
          </button>
        </template>
      </Column>
    </DataTable>
    <div v-else class="spinner-class">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
    </div>
    <Dialog v-model:visible="mostrarBusqueda" modal :closable="false" :dismissableMask="true" :closeOnEscape="true"
      position="custom" :style="{
        top: this.y + 'px',
        left: this.x + 'px',
        position: 'absolute',
      }" @blur="limpiarInputs">
      <div class="campo-busqueda">
        <span v-if="esColumnaFecha(nombreColumna)" style="font-weight: bold;">Buscar por: {{ nombreColumna }}</span>
        <div v-if="esColumnaFecha(nombreColumna)" class="calendar-button">
          <select v-model="fechaComparacion" @change="limpiarInputs" style="background-color: none">
            <option value="antes">Antes de</option>
            <option value="despues">Después de</option>
            <option value="entre">Entre</option>
          </select>
          <button @click="buscar" style="text-align: start" :disabled="!searchQuery && !searchQuery2 && fechaEntreComparacion === ''
            ">
            Buscar
          </button>
        </div>
      </div>
      <div v-if="!esColumnaFecha(nombreColumna)" style="padding-top: 7%;">
        <FloatLabel>
          <InputText id="buscar" v-model="searchQuery" @keyup.enter="buscar" class="search-input" />
          <label for="buscar">Buscar por: {{ nombreColumna }}</label>
        </FloatLabel>
        <button class="cambiar-pagina-en-movil" @click="buscar">Buscar</button>
      </div>
      <div v-else>
        <DatePicker v-if="fechaComparacion != 'entre'" v-model="searchQuery" :manualInput="false"
          placeholder="Selecciona fecha" showButtonBar dateFormat="dd/mm/yy" style="width: 100%;" />
        <DatePicker v-else placeholder="Selecciona fechas" v-model="searchQuery2" selectionMode="range"
          :manualInput="true" showButtonBar dateFormat="dd/mm/yy">
          <template #footer>
            <select v-model="fechaEntreComparacion" @change="limpiarInputs" class="fecha-entre-comparacion">
              <option disabled value="">Seleccione último...</option>
              <option value="semana">Última semana</option>
              <option value="mes">Último mes</option>
              <option value="año">Último año</option>
            </select>
          </template>
        </DatePicker>
      </div>
    </Dialog>
    <Dialog v-model:visible="mostrarRegistro" modal :header="cabeceraRegistro" :closable="true" :dismissableMask="true" :closeOnEscape="true" style="height: 90%; width: 90%; padding: 2%;" @hide="eliminar = false">
      <div class="virtualscrollers">
        <VirtualScroller :items="left" :item-size="30" class="border border-surface-200 dark:border-surface-700 rounded "
            :style="{ width: '50%', height: sizeVirtualScroller + 'vh' }">
          <template #item="slotProps">
            <div class="data-row">
              <label class="data-key">{{ slotProps.item.key }}</label>
              <div class="data-value">{{ slotProps.item.value }}</div>
            </div>
          </template>
        </VirtualScroller>
        <VirtualScroller :items="right" :item-size="30"
          class="border border-surface-200 dark:border-surface-700 rounded"              
          :style="{ width: '50%', height: sizeVirtualScroller + 'vh' }">          >
          <template #item="slotProps">
            <div class="data-row">
              <label class="data-key">{{ slotProps.item.key }}</label>
              <div class="data-value">{{ slotProps.item.value }}</div>
            </div>
          </template>
        </VirtualScroller>
      </div>

      <div v-if="eliminar">
        <ConfirmPopup></ConfirmPopup>
        <button class="confirmar-borrado" @click="mostrarRegistro = false">No</button>
        <button class="confirmar-borrado si-borrar" @click="confirm3($event)" severity="danger" outlined>Si</button>
      </div>
    </Dialog>
  </div>
  <div class="paginacion-container">
    <div class="cargar-grafica">
      <button @click="showDialog = true; this.cargandoGrafica = false" class="generar-grafica" v-if="cargado">
        Generar Gráfica
      </button>
      <div class="cargar-spinner" v-else>
        <i class="pi pi-spin pi-spinner" style="font-size: 1rem"></i>
      </div>
    </div>
    <div class="paginacion">
      <button v-if="postdata.page > 2" @click="postdata.page = 0" :disabled="!cargado">
        1
      </button>
      <button @click="postdata.page -= 1" :disabled="postdata.page === 0 || !cargado">
        < </button>
          <button v-for="offset in calcularRango()" :key="offset" :class="{
            active: postdata.page === calcularPagina(offset),
            'paginacion-ordenador': true,
          }" @click="postdata.page = calcularPagina(offset)" :disabled="!cargado">
            {{ calcularPagina(offset) + 1 }}
          </button>
          <span class="nPagina">{{ postdata.page + 1 }}</span>
          <button @click="postdata.page += 1" :disabled="postdata.page >= maxPaginas - 1 || !cargado">
            >
          </button>
          <button style="min-width: auto;"
            v-if="maxPaginas > 5 && ((postdata.page < maxPaginas - 3) || maxPaginas == null)"
            @click="postdata.page = maxPaginas - 1" :disabled="!cargado">
            {{ maxPaginas }}
          </button>
    </div>
    
    <div class="elementos-pagina">
      <div style="margin-bottom: 3%;">
        <span>Registros por página: </span>
        <input type="number" style="min-height: 35px;" v-model.number="inputPageSize" @keyup.enter="cambiarPageSize"
          @blur="handleBlur" min="1" />
        <button class="cambiar-pagina-en-movil" :disabled="!inputPageSize" @click="cambiarPageSize">
          Mostrar
        </button>
      </div>
      <span>Se han encontrado {{ nTotalDatos }} datos</span>
    </div>
  </div>
  <Dialog v-model:visible="showDialog" header="Generar Gráfica" :modal="true" :closable="false" style="padding: 1%">
    <div>
      <label for="xAxis">Mostrar por: </label>
      <select v-model="selectedXAxis" id="xAxis">
        <option v-for="column in headers" :key="column" :value="column.field">
          {{ column.header }}
        </option>
      </select>
    </div>
    <div>
      <label for="yAxis">Contar por número de: </label>
      <select v-model="selectedYAxis" id="yAxis">
        <option v-for="column in headers" :key="column" :value="column.field">
          {{ column.header }}
        </option>
      </select>
    </div>
    <div style="margin-top: 1%">
      <button @click="generarGrafica" :disabled="!selectedXAxis || !selectedYAxis || cargandoGrafica">
        Generar
      </button>
      <button @click="showDialog = false" :disabled="cargandoGrafica">Cancelar</button>
      <div v-if="cargandoGrafica" style="float: right">
        <i class="pi pi-spin pi-spinner" style="font-size: 1rem"></i>
      </div>
    </div>
  </Dialog>
  <canvas v-if="cargandoGrafica" id="chartContainer" width="300" height="100"></canvas>
</template>

<style scoped>
.table-container {
  flex-direction: column;
  padding: 2%;
  height: 77vh;
  font-size: small;  
}

.header-button {
  border: none;
  background: none;
  cursor: pointer
}

.paginacion-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0% 4% 4% 4%;
  font-size: small;
}

.paginacion button.active {
  background-color: #ff6600;
  font-weight: bold
}

.paginacion button:hover {
  background-color: #fd70129a;
}

.paginacion {
  gap: 2px;
  display: flex;
}

.cambiar-pagina-en-movil {
  display: none
}

.paginacion-ordenador {
  display: block
}

.cargar-grafica {
  min-width: 12%
}

.cambiar-pagina-en-movil,
.generar-grafica,
.paginacion button {
  background-color: #919090;
  color: white;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  margin: 0.2%;
  border-radius: 5px
}

button:disabled {
  background-color: #000000c1;
  cursor: not-allowed;
  color: white;
}

input {
  width: 60px
}

.search-input {
  width: 100%;
  padding: 10px;
  border-radius: 20px;
  color: white;
}

.calendar-button {
  display: grid;
  padding-left: 5%;
}

.cabeceras {
  font-weight: bold;
  text-align: center;
  white-space: initial;
  line-height: 90%;
}

.limpiar-busqueda {
  font-weight: bold;
  width: 100%
}

.spinner-class {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.campo-busqueda {
  margin: 3%;
  display: flex
}

.nPagina {
  display: none
}

.fecha-entre-comparacion {
  background-color: none;
  margin-left: 22%;
  padding: 2%;
}

.boton-eliminar {
  padding: 19%;
  margin-left: 27%;
  margin-bottom: 7%;
  border: groove, thin, red;
  border-radius: 20%;
}

.boton-editar:hover {
  background-color: blue;
  cursor: pointer;
}

.boton-eliminar:hover {
  background-color: red;
  cursor: pointer;
}

.boton-editar {
  padding: 30%;
  margin-left: 13%;
  margin-bottom: 7%;
  border: groove, thin, blue;
  border-radius: 20%;
}

.elementos-pagina {
  display: grid;
}

.confirmar-borrado {
  float: right;
  margin-right: 2%;
  padding: 1%;
  border-radius: 20px;
  min-width: 4%;
  cursor: pointer;
  font-weight: bold;
}

.si-borrar {
  background-color: red;
}

.si-borrar:hover {
  background-color: rgba(255, 0, 0, 0.653);
  cursor: pointer;
}

.virtualscrollers {
  display: flex;
  gap: 2%;
  margin-bottom: 1%;
}

.data-row {
  display: flex;
  flex-direction: row;
  padding: 2px 2px 2px 7px;
  height: 50px;
}

.data-key {
  font-weight: bolder;
  border: 1px, solid;
  border-radius: 5px 0 0 5px;
  width: 80%;
  padding: 1.5%;
}

.data-value {
  border: 1px, solid;
  border-left: none;
  border-radius: 0 5px 5px 0;
  font-size: 0.9em;
  width: 80%;
  padding: 2%;
  align-content: center;
}

.titulo-scroller {
  margin: 2%;
  font-weight: bold;
  font-size: 1.2em;
}

@media (max-width: 768px) {
  .table-container {
    width: 100%;
    overflow-x: auto;
    height: 44vh;
  }

  .paginacion-container {
    justify-content: space-between
  }

  .cargar-grafica {
    min-width: 25%
  }

  .generar-grafica,
  .elementos-pagina {
    display: grid;
    place-items: center;
    text-align: center;
    max-width: 90px;
  }

  .paginacion {
    justify-content: center
  }

  .paginacion button {
    padding: 8% 12%;
    margin: 2%
  }

  .cambiar-pagina-en-movil {
    display: block;
    margin-top: 5%;
    margin-left: 7%;
  }

  .cargar-spinner {
    margin-left: 9.3%
  }

  .paginacion-ordenador {
    display: none
  }

  .nPagina {
    margin: 5%;
    display: block;
    align-content: center;
  }
}
</style>

<script>
import axios from "axios"
import { useToast } from "primevue/usetoast"
import DataTable from "primevue/datatable"
import Column from "primevue/column"
import Toast from "primevue/toast"
import Dialog from "primevue/dialog"
import DatePicker from "primevue/datepicker"
import Chart from "chart.js/auto"
import "primeicons/primeicons.css"
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import ConfirmPopup from 'primevue/confirmpopup';
import { useConfirm } from "primevue/useconfirm";
import VirtualScroller from "primevue/virtualscroller"

export default {
  name: "TablaDatos",
  components: {
    DataTable,
    Column,
    Toast,
    Dialog,
    DatePicker,
    FloatLabel,
    InputText,
    ConfirmPopup,
    VirtualScroller,
  },
  setup() {
    const toast = useToast();
    const confirm = useConfirm();

    const confirm3 = (event) => {
      confirm.require({
        target: event.currentTarget,
        message: 'Confirma la eliminación de este dato',
        icon: 'pi pi-info-circle',
        acceptProps: {
          label: 'Si',
          severity: 'danger'
        },
        rejectProps: {
          label: 'No',
          severity: 'secondary',
          outlined: true
        },
        accept: () => {
          toast.add({ severity: 'info', summary: 'Confirmado', detail: 'Registro eliminado correctamente', life: 3000 });
          this.mostrarRegistro=false
        },
      });
    };
    return {
      confirm3,
      toast,
      confirm,
    };
  },
  data() {
    return {
      response: [],
      getDatos: "", //direccion concreta de llamada
      getNDatos: "", //direccion concreta de llamada contar datos
      postdata: { //datos a enviar
        page: 0,
        page_size: 10,
        orderby: null,
      },
      inputPage: null,
      inputPageSize: 10,
      formattedDatos: [],
      headers: [],
      headersOriginales: [],
      orden: {},
      icono: "↑↓",
      cargado: false,
      mostrarBusqueda: false,
      buscando: false,
      limpiarBusqueda: false,
      searchQuery: "",
      searchQuery2: "",
      fechaComparacion: "antes",
      fechaEntreComparacion: "",
      nombreColumna: "",
      x: 0,
      y: 0,
      columnasFechas: [],
      maxPaginas: 0,
      showDialog: false,
      selectedXAxis: null,
      selectedYAxis: null,
      chartConfig: null,
      cargandoGrafica: false,
      mostrarRegistro: false,
      eliminar: false,
      nTotalDatos: 0,
      registroClicado: [],
      left: [],
      right: [],
      cabeceraRegistro: "Informacion del registro",
      sizeVirtualScroller: 67,
    }
  },
  mounted() {
    this.getDatos();
    this.contarPaginas();
  },
  watch: {
    response: {
      immediate: true,
      handler(newResponse) {
        if (newResponse.length > 0) {
          this.headersOriginales = Object.keys(newResponse[0])
          this.headers = this.headersOriginales.map((key) => ({
            field: key,
            header: this.formatHeader(key),
          }))
          this.formattedDatos = this.formatearDatos(newResponse)
        }
      },
    },
    "postdata.page": function () {
      this.getDatos()
    },
    "postdata.page_size": function () {
      this.contarPaginas()
    },
    "fechaEntreComparacion": function () {
      this.cambiarEntreFechas()
    },
    "eliminar":function(){
      if(this.eliminar){
        this.cabeceraRegistro="¿Estás seguro que quiere eliminar este registro?"
        this.sizeVirtualScroller=64
      }else{
        this.cabeceraRegistro="Información de registro"
        this.sizeVirtualScroller=67
      }
    }
  },
  methods: {
    async getDatos(cbOK, cbKO) {
      this.cargado = false
      try {
        const res = await axios.get(this.$svc + this.getDatos, {
          params: this.postdata,
        })
        this.response = res.data
        if (this.response.length === 0 || this.postdata.page < 0) {
          if (this.buscando == true) {
            this.mostrarToast(
              "error",
              "ERROR",
              "No hay datos para esta busqueda"
            )
            this.postdata = { page: 0, page_size: 10, orderby: null }
            this.buscando = false
            this.getDatos()
            this.limpiarInputs()
          } else {
            this.mostrarToast(
              "error",
              "ERROR",
              "No hay datos que mostrar en esta página.\n Esta es la última."
            )
            this.limpiarBusqueda = false
            this.buscando = false
            this.postdata.page = this.maxPaginas - 1
          }
        } else {
          if (typeof cbOK === "function") cbOK(this.response)
          this.cargado = true
          if (this.buscando) this.limpiarBusqueda = true
        }
      } catch (err) {
        this.mostrarToast(
          "error",
          "ERROR",
          "Error de conexion con el servidor, intentelo de nuevo más tarde"
        )
        if (typeof cbKO === "function") cbKO(err)
      }
    },
    async contarPaginas(params) {
      try {
        const res = await axios.get(this.$svc + this.getNDatos, {
          params: params,
        })
        this.nTotalDatos = res.data
        const resto = res.data % this.postdata.page_size
        this.maxPaginas = Math.floor(res.data / this.postdata.page_size)
        if (resto !== 0) {
          this.maxPaginas += 1
        }
      } catch (err) {
        this.mostrarToast(
          "error",
          "ERROR",
          "Error de conexion con el servidor, intentelo de nuevo más tarde"
        )
      }
    },
    formatearDatos(datos) {
      return datos.map((row) => {
        const formattedRow = { ...row }
        for (const key in formattedRow) {
          if (
            typeof formattedRow[key] === "string" &&
            formattedRow[key].includes("GMT")
          ) {
            formattedRow[key] = this.formatFechaTabla(formattedRow[key])
            if (!this.columnasFechas.includes(key)) {
              this.columnasFechas.push(key)
            }
          }
        }
        return formattedRow
      })
    },
    formatFechaTabla(dateString) {
      const date = new Date(dateString)
      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const year = date.getFullYear()
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = date.getMinutes().toString().padStart(2, "0")
      return `${day}/${month}/${year} ${hours}:${minutes}`
    },
    formatHeader(key) {
      return key.replace(/_/g, " ").toUpperCase();
    },
    unformatHeader(formattedColumnName) {
      const originalColumn = this.headers.find((col) => {
        return (
          this.formatHeader(col.field).toLowerCase() ===
          formattedColumnName.toLowerCase()
        )
      })
      return originalColumn ? originalColumn.field : null
    },
    getBodyTemplate(field) {
      return (rowData) => {
        const value = rowData[field]
        if (typeof value === "string" && value.includes("GMT")) {
          return this.formatFechaTabla(value)
        }
        return value
      }
    },
    orderBy(field) {
      for (let key in this.orden) {
        if (key !== field) {
          this.orden[key] = null
        }
      }
      if (!this.orden[field]) {
        this.orden[field] = 2
      } else if (this.orden[field] === 2) {
        this.orden[field] = 3
      } else if (this.orden[field] === 3) {
        this.orden[field] = 1
      } else {
        this.orden[field] = 2
      }
      if (this.orden[field] != 1) {
        this.postdata.orderby =
          field +
          (this.orden[field] === 2
            ? ".asc()"
            : this.orden[field] === 3
              ? ".desc()"
              : "")
      } else {
        this.postdata.orderby = null
      }
      this.getDatos()
    },
    getIcono(field) {
      if (this.orden[field] === 2) {
        return "↑"
      } else if (this.orden[field] === 3) {
        return "↓"
      } else {
        return "↑↓"
      }
    },
    agregarCriterio() {
      const columna = this.unformatHeader(this.nombreColumna);
      let criterio = {};

      if (this.esColumnaFecha(this.nombreColumna)) {
        if (this.fechaComparacion === "antes") {
          const formattedFecha1 = this.formatFechaBusqueda(this.formatFechaTabla(this.searchQuery));
          criterio[columna] = `<=${formattedFecha1}`;
        } else if (this.fechaComparacion === "despues") {
          const formattedFecha1 = this.formatFechaBusqueda(this.formatFechaTabla(this.searchQuery));
          criterio[columna] = `>=${formattedFecha1}`;
        } else if (this.fechaComparacion === "entre") {
          const fecha1 = this.formatFechaBusqueda(this.formatFechaTabla(this.searchQuery2[0]));
          const fecha2 = this.formatFechaBusqueda(this.formatFechaTabla(this.searchQuery2[1]));
          criterio[columna] = `BETWEEN ${fecha1} AND ${fecha2}`;
        }
      } else {
        criterio[columna] = this.searchQuery;
      }

      this.criterios = { ...this.criterios, ...criterio };
    },

    buscar() {
      this.agregarCriterio()
      const params = {
        page: 0,
        page_size: this.postdata.page_size,
        orderby: this.postdata.orderby,
        ...this.criterios
      };
      this.postdata = params;
      this.contarPaginas();
      this.mostrarBusqueda = false;
      this.buscando = true;
      this.searchQuery = "";
      this.getDatos();
    },
    limpiarInputs() {
      this.searchQuery = ""
      this.searchQuery2 = ""
    },
    borrarBusqueda() {
      this.searchQuery = ""
      this.searchQuery2 = ""
      this.buscando = false
      this.limpiarBusqueda = false
      var buscar = false
      if (this.postdata.page == 0) {
        buscar = true
      }
      this.postdata = {
        page: 0,
        page_size: 10,
        orderby: null,
      }
      if (buscar) {
        this.getDatos()
      }
    },
    abrirBusqueda(header, event) {
      this.nombreColumna = header
      this.mostrarBusqueda = true
      this.y = event.clientY
      this.x = event.clientX - 60
    },
    cambiarPageSize() {
      if (this.inputPageSize != this.postdata.page_size) {
        const currentPosition = this.postdata.page * this.postdata.page_size
        this.postdata.page_size = this.inputPageSize
        if (this.postdata.page != 0) {
          this.postdata.page = Math.floor(currentPosition / this.inputPageSize)
        } else {
          this.getDatos()
        }
      }
    },
    esColumnaFecha(header) {
      const originalColumn = this.unformatHeader(header)
      return this.columnasFechas.includes(originalColumn)
    },
    clearInput() {
      this.searchQuery = ""
      this.searchQuery2 = ""
    },
    formatFechaBusqueda(fechaString) {
      const [fecha, hora] = fechaString.split(" ")
      const [dia, mes, anio] = fecha.split("/")
      return `${anio}-${mes}-${dia}`
    },
    async generarGrafica() {
      this.cargandoGrafica = true
      try {
        const res = await axios.get(this.$svc + this.getDatos, {
          params: { page: 0, page_size: this.nTotalDatos },
        })
        const datosGrafica = this.formatearDatos(res.data)
        const labels = []
        const data = []
        if (this.selectedYAxis === this.selectedXAxis) {
          datosGrafica.forEach((element) => {
            const valorX = element[this.selectedXAxis]
            if (labels.includes(valorX)) {
              const pos = labels.indexOf(valorX)
              data[pos] += 1
            } else {
              labels.push(valorX)
              data.push(1)
            }
          })
          const backgroundColor = labels.map(
            () =>
              "#" +
              ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0")
          )
          const ctx = document
            .getElementById("chartContainer")
            .getContext("2d")
          if (this.chart) {
            this.chart.destroy()
          }
          this.chart = new Chart(ctx, {
            type: "bar",
            data: {
              labels: labels,
              datasets: [
                {
                  label: this.selectedXAxis,
                  data: data,
                  backgroundColor: backgroundColor,
                  borderColor: "black",
                  borderWidth: 1,
                },
              ],
            },
            options: {
              plugins: {
                legend: {
                  display: false,
                  labels: {
                    generateLabels: (chart) => {
                      const datasets = chart.data.datasets
                      return datasets[0].data.map((data, index) => ({
                        text: `${chart.data.labels[index]}: ${data}`,
                        fillStyle: datasets[0].backgroundColor[index],
                        hidden: false,
                        index: index,
                      }))
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            },
          })
        } else {
          const conteo = {}
          datosGrafica.forEach((element) => {
            const empresa = element[this.selectedXAxis]
            const signo = element[this.selectedYAxis]
            if (!labels.includes(empresa)) {
              labels.push(empresa)
            }
            if (!conteo[empresa]) {
              conteo[empresa] = {}
            }
            if (!conteo[empresa][signo]) {
              conteo[empresa][signo] = 0
            }
            conteo[empresa][signo]++
          })
          const signos = Array.from(
            new Set(datosGrafica.map((element) => element[this.selectedYAxis]))
          )
          const datasets = signos.map((signo) => {
            return {
              label: signo,
              backgroundColor:
                "#" +
                ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0"),
              data: labels.map((empresa) => conteo[empresa][signo] || 0),
            }
          })
          const maxDataValue = Math.max(
            ...datasets.flatMap((dataset) => dataset.data)
          )
          const ctx = document
            .getElementById("chartContainer")
            .getContext("2d")
          if (this.chart) {
            this.chart.destroy()
          }
          this.chart = new Chart(ctx, {
            type: "bar",
            data: {
              labels: labels,
              datasets: datasets,
            },
            options: {
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                x: {
                  stacked: true,
                },
                y: {
                  beginAtZero: true,
                  stacked: true,
                  suggestedMax: maxDataValue + maxDataValue * 0.1,
                },
              },
            },
          })
        }
        if (labels.length === 0) {
          this.mostrarToast("error", "ERROR", "No hay datos que mostrar")
          return
        }
        this.showDialog = false
      } catch (err) {
        this.mostrarToast(
          "error",
          "ERROR",
          "Error de conexion con el servidor, intentelo de nuevo más tarde"
        )
      }
    },
    mostrarToast(severity, summary, detail) {
      this.toast.add({
        severity: severity,
        summary: summary,
        detail: detail,
        life: 3000,
      })
    },
    cambiarEntreFechas() {
      const hoy = new Date()
      let fechaInicio = new Date(hoy)
      if (this.fechaEntreComparacion != "") {
        if (this.fechaEntreComparacion === "semana") {
          fechaInicio.setDate(hoy.getDate() - 7)
        } else if (this.fechaEntreComparacion === "mes") {
          fechaInicio.setMonth(hoy.getMonth() - 1)
        } else if (this.fechaEntreComparacion === "año") {
          fechaInicio.setFullYear(hoy.getFullYear() - 1)
        }
        this.searchQuery2 = [fechaInicio, hoy]
        this.buscar()
      }
    },
    onRowSelect(event) {
      if (event && event.data) {
      this.registroClicado = Object.entries(event.data).map(([key, value]) => ({ key: this.formatHeader(key), value }));
      this.left = this.registroClicado.slice(0, Math.ceil(this.registroClicado.length / 2));
      this.right = this.registroClicado.slice(Math.ceil(this.registroClicado.length / 2));
      this.mostrarRegistro = true;
      } else {
      this.mostrarToast("error", "ERROR", "No se ha podido mostrar la información del registro");
      }
    },
    // Edicion si se quiere mandar a otro lado
    // handleEditClick(rowData) {
    //   this.formToDisplay = '';
    //   this.labelDataSelected = rowData[this.headers[2].field];
    // },
    calcularRango() {
      const totalBotones = Math.min(this.maxPaginas, 5);
      return Array.from({ length: totalBotones }, (_, i) => i);
    },
    calcularPagina(offset) {
      if (this.postdata.page < 3) {
        return offset;
      } else if (this.postdata.page >= this.maxPaginas - 2) {
        return this.maxPaginas - 5 + offset;
      } else {
        return this.postdata.page - 2 + offset;
      }
    },
  },
} 
</script>
