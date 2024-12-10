import { XMLParser } from 'fast-xml-parser'
import { saveAs } from 'file-saver'
import onEvent from './onEvent.js'

let data = null
let name = null

const extractor = {
  importXML(event) {
    const matchUpload = event.target.matches('#upload')
    // Get input box
    if (matchUpload) {
      const inputUpload = document.querySelector('#upload')

      const file = inputUpload.files[0]
      name = file.name.replace('.xml', '')

      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = () => {
        if (file.type === 'text/xml') {
          data = reader.result

          const downloadElem = document.querySelector('#download')
          downloadElem.classList.add('is-visible')
        } else {
          alert('El archivo no es XML')
          // Empty input box
          event.target.value = null
        }
      }
    }
  },
  convert() {
    const xmlFile = data

    // For XML parser
    const options = {
      ignoreAttributes: false,
      preserveOrder: true
    }

    const parser = new XMLParser(options)
    const jsonObj = parser.parse(xmlFile)

    const root = jsonObj.length === 1 ? 0 : 1

    const fecha = jsonObj[root][':@']['@_Fecha'].substring(0, 10)

    const descripcion = () => {
      const conceptos = jsonObj[root]['cfdi:Comprobante'][2]['cfdi:Conceptos']
      let desc = []
      for (let i = 0; i < conceptos.length; i++) {
        let item =
          jsonObj[root]['cfdi:Comprobante'][2]['cfdi:Conceptos'][i][':@'][
            '@_Descripcion'
          ]
        desc.push(item)
      }
      // Create new array without duplicate values
      const descripciones = [...new Set(desc)]
      return descripciones.join(' - ')
    }

    const usoCFDI = () => {
      const uso = jsonObj[root]['cfdi:Comprobante'][1][':@']['@_UsoCFDI']
      if (uso === 'G01') {
        return 'ADQUISICIÓN DE MERCANCÍAS'
      } else if (uso === 'G02') {
        return 'DEVOLUCIONES, DESCUENTOS O BONIFICACIONES'
      } else if (uso === 'G03') {
        return 'GASTOS EN GENERAL'
      } else if (uso === 'I01') {
        return 'CONSTRUCCIONES'
      } else if (uso === 'I02') {
        return 'MOBILIARIO Y EQUIPO DE OFICINA POR INVERSIONES'
      } else if (uso === 'I03') {
        return 'EQUIPO DE TRANSPORTE'
      } else if (uso === 'I04') {
        return 'EQUIPO DE COMPUTO Y ACCESORIOS'
      } else if (uso === 'I05') {
        return 'DADOS, TROQUELES, MOLDES, MATRICES Y HERRAMENTAL'
      } else if (uso === 'I06') {
        return 'COMUNICACIONES TELEFÓNICAS'
      } else if (uso === 'I07') {
        return 'COMUNICACIONES SATELITALES'
      } else if (uso === 'I08') {
        return 'OTRA MAQUINARIA Y EQUIPO'
      } else if (uso === 'D01') {
        return 'HONORARIOS MÉDICOS, DENTALES Y GASTOS HOSPITALARIOS'
      } else if (uso === 'D02') {
        return 'GASTOS MÉDICOS POR INCAPACIDAD O DISCAPACIDAD'
      } else if (uso === 'D03') {
        return 'GASTOS FUNERALES'
      } else if (uso === 'D04') {
        return 'DONATIVOS'
      } else if (uso === 'D05') {
        return 'INTERESES REALES EFECTIVAMENTE PAGADOS POR CRÉDITOS HIPOTECARIOS (CASA HABITACIÓN)'
      } else if (uso === 'D06') {
        return 'APORTACIONES VOLUNTARIAS AL SAR'
      } else if (uso === 'D07') {
        return 'PRIMAS POR SEGUROS DE GASTOS MÉDICOS'
      } else if (uso === 'D08') {
        return 'GASTOS DE TRANSPORTACIÓN ESCOLAR OBLIGATORIA'
      } else if (uso === 'D09') {
        return 'DEPÓSITOS EN CUENTAS PARA EL AHORRO, PRIMAS QUE TENGAN COMO BASE PLANES DE PENSIONES'
      } else if (uso === 'D10') {
        return 'PAGOS POR SERVICIOS EDUCATIVOS (COLEGIATURAS)'
      } else if (uso === 'P01') {
        return 'POR DEFINIR'
      } else if (uso === 'S01') {
        return 'SIN EFECTOS FISCALES'
      } else if (uso === 'CP01') {
        return 'PAGOS'
      } else if (uso === 'CN01') {
        return 'NÓMINA'
      } else {
        return ''
      }
    }

    const formaPago = () => {
      let pago =
        jsonObj[root]['cfdi:Comprobante'].length === 5
          ? jsonObj[root][':@']['@_FormaPago']
          : jsonObj[root]['cfdi:Comprobante'][3]['cfdi:Complemento'][0][
              'pago20:Pagos'
            ][1][':@']['@_FormaDePagoP']

      if (pago === '01') {
        return 'EFECTIVO'
      } else if (pago === '02') {
        return 'CHEQUE NOMINATIVO'
      } else if (pago === '03') {
        return 'TRANSFERENCIA ELECTRÓNICA DE FONDOS SPEI'
      } else if (pago === '04') {
        return 'TARJETA DE CRÉDITO'
      } else if (pago === '05') {
        return 'MONEDERO ELECTRÓNICO'
      } else if (pago === '06') {
        return 'DINERO ELECTRÓNICO'
      } else if (pago === '08') {
        return 'VALES DE DESPENSA'
      } else if (pago === '12') {
        return 'DACIÓN EN PAGO'
      } else if (pago === '13') {
        return 'PAGO POR SUBROGACIÓN'
      } else if (pago === '14') {
        return 'PAGO POR CONSIGNACIÓN'
      } else if (pago === '15') {
        return 'CONDONACIÓN'
      } else if (pago === '17') {
        return 'COMPENSACIÓN'
      } else if (pago === '23') {
        return 'NOVACIÓN'
      } else if (pago === '24') {
        return 'CONFUSIÓN'
      } else if (pago === '25') {
        return 'REMISIÓN DE DEUDA'
      } else if (pago === '26') {
        return 'PRESCRIPCIÓN O CADUCIDAD'
      } else if (pago === '27') {
        return 'A SATISFACCIÓN DEL ACREEDOR'
      } else if (pago === '28') {
        return 'TARJETA DE DÉBITO'
      } else if (pago === '29') {
        return 'TARJETA DE SERVICIOS'
      } else if (pago === '30') {
        return 'APLICACIÓN DE ANTICIPOS'
      } else if (pago === '31') {
        return 'INTERMEDIARIO PAGOS'
      } else if (pago === '99') {
        return 'POR DEFINIR'
      } else {
        return ''
      }
    }

    const subTotal = jsonObj[root][':@']['@_SubTotal']

    const descuento = () => {
      const cantidad = jsonObj[root][':@']['@_Descuento']
      if (cantidad !== undefined) {
        return cantidad
      } else {
        return ''
      }
    }

    const impuestos =
      jsonObj[root]['cfdi:Comprobante'].length === 5
        ? jsonObj[root]['cfdi:Comprobante'][3]['cfdi:Impuestos']
        : jsonObj[root]['cfdi:Comprobante'][3]['cfdi:Complemento'][0][
            'pago20:Pagos'
          ][1]['pago20:Pago'][1]['pago20:ImpuestosP']

    const ivaTrasladado = () => {
      let iva = 0
      Object.keys(impuestos).forEach((i) => {
        if (impuestos[i]['cfdi:Traslados'] !== undefined) {
          Object.keys(impuestos[i]['cfdi:Traslados']).forEach((e) => {
            if (
              impuestos[i]['cfdi:Traslados'][e][':@']['@_Impuesto'] === '002'
            ) {
              iva =
                iva +
                Number(impuestos[i]['cfdi:Traslados'][e][':@']['@_Importe'])
            }
          })
        } else if (impuestos[i]['pago20:TrasladosP'] !== undefined) {
          Object.keys(impuestos[i]['pago20:TrasladosP']).forEach((e) => {
            if (
              impuestos[i]['pago20:TrasladosP'][e][':@']['@_ImpuestoP'] ===
              '002'
            ) {
              iva =
                iva +
                Number(impuestos[i]['pago20:TrasladosP'][e][':@']['@_ImporteP'])
            }
          })
        }
      })
      if (iva > 0) {
        return iva
      } else {
        return ''
      }
    }

    const ivaRetenido = () => {
      let iva = 0
      Object.keys(impuestos).forEach((i) => {
        if (impuestos[i]['cfdi:Retenciones'] !== undefined) {
          Object.keys(impuestos[i]['cfdi:Retenciones']).forEach((e) => {
            if (
              impuestos[i]['cfdi:Retenciones'][e][':@']['@_Impuesto'] === '002'
            ) {
              iva =
                iva +
                Number(impuestos[i]['cfdi:Retenciones'][e][':@']['@_Importe'])
            }
          })
        } else if (impuestos[i]['pago20:RetencionesP'] !== undefined) {
          Object.keys(impuestos[i]['pago20:RetencionesP']).forEach((e) => {
            if (
              impuestos[i]['pago20:RetencionesP'][e][':@']['@_ImpuestoP'] ===
              '002'
            ) {
              iva =
                iva +
                Number(
                  impuestos[i]['pago20:RetencionesP'][e][':@']['@_ImporteP']
                )
            }
          })
        }
      })
      if (iva > 0) {
        return iva
      } else {
        return ''
      }
    }

    const isrRetenido = () => {
      let isr = 0
      Object.keys(impuestos).forEach((i) => {
        if (impuestos[i]['cfdi:Retenciones'] !== undefined) {
          Object.keys(impuestos[i]['cfdi:Retenciones']).forEach((e) => {
            if (
              impuestos[i]['cfdi:Retenciones'][e][':@']['@_Impuesto'] === '001'
            ) {
              isr =
                isr +
                Number(impuestos[i]['cfdi:Retenciones'][e][':@']['@_Importe'])
            }
          })
        } else if (impuestos[i]['pago20:RetencionesP'] !== undefined) {
          Object.keys(impuestos[i]['pago20:RetencionesP']).forEach((e) => {
            if (
              impuestos[i]['pago20:RetencionesP'][e][':@']['@_ImpuestoP'] ===
              '001'
            ) {
              iva =
                iva +
                Number(
                  impuestos[i]['pago20:RetencionesP'][e][':@']['@_ImporteP']
                )
            }
          })
        }
      })
      if (isr > 0) {
        return isr
      } else {
        return ''
      }
    }

    const iepsTrasladado = () => {
      let ieps = 0
      Object.keys(impuestos).forEach((i) => {
        if (impuestos[i]['cfdi:Traslados'] !== undefined) {
          Object.keys(impuestos[i]['cfdi:Traslados']).forEach((e) => {
            if (
              impuestos[i]['cfdi:Traslados'][e][':@']['@_Impuesto'] === '003'
            ) {
              ieps =
                ieps +
                Number(impuestos[i]['cfdi:Traslados'][e][':@']['@_Importe'])
            }
          })
        } else if (impuestos[i]['pago20:TrasladosP'] !== undefined) {
          Object.keys(impuestos[i]['pago20:TrasladosP']).forEach((e) => {
            if (
              impuestos[i]['pago20:TrasladosP'][e][':@']['@_ImpuestoP'] ===
              '003'
            ) {
              iva =
                iva +
                Number(impuestos[i]['pago20:TrasladosP'][e][':@']['@_ImporteP'])
            }
          })
        }
      })
      if (ieps > 0) {
        return ieps
      } else {
        return ''
      }
    }

    const folioFactura = () => {
      const folio = jsonObj[root][':@']['@_Folio']
      if (folio !== undefined) {
        return folio
      } else {
        return ''
      }
    }

    const rootFolio = jsonObj[root]['cfdi:Comprobante'].length === 5 ? 4 : 3

    const rootFiscal = jsonObj[root]['cfdi:Comprobante'].length === 5 ? 0 : 1

    const folioFiscal =
      jsonObj[root]['cfdi:Comprobante'][rootFolio]['cfdi:Complemento'][
        rootFiscal
      ][':@']['@_UUID']

    // @ to format text to columns in excel
    data = `@${fecha}@@@@${descripcion()}@@${usoCFDI()}@${formaPago()}@${subTotal}@${descuento()}@${ivaTrasladado()}@${ivaRetenido()}@${isrRetenido()}@${iepsTrasladado()}@@${folioFactura()}@${folioFiscal}`
  },
  exportData(event) {
    const matchDownload = event.target.matches('#download')
    if (matchDownload) {
      extractor.convert()
      let blob = new Blob([data], {
        type: 'text/plain;charset=utf-8'
      })
      // Save text document
      saveAs(blob, `${name}.txt`)

      const downloadElem = document.querySelector('#download')
      downloadElem.classList.remove('is-visible')

      const uploadElem = document.querySelector('#upload')
      uploadElem.value = null
    }
  },
  init() {
    onEvent('change', extractor.importXML)
    onEvent('click', extractor.exportData)
  }
}

export default extractor
