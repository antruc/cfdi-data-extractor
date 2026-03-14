import { XMLParser } from 'fast-xml-parser'
import { saveAs } from 'file-saver'

let data = null
let name = null

const extractor = {
  importXML(event) {
    if (event.target.matches('#upload')) {
      const inputUpload = document.querySelector('#upload')

      // Get the first file from the file input
      const file = inputUpload.files[0]
      // Get the file name without the ".xml" extension
      name = file.name.replace('.xml', '')

      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = () => {
        if (file.type === 'text/xml') {
          data = reader.result
          document.querySelector('#download').classList.add('is-visible')
        } else {
          alert('El archivo no es XML')
          // Empty input box
          inputUpload.value = null // Reset the file input box
        }
      }
    }
  },
  convert() {
    const xmlFile = data

    // Set options for the XML parser
    const options = {
      ignoreAttributes: false,
      preserveOrder: true
    }
    const parser = new XMLParser(options)
    const jsonObj = parser.parse(xmlFile)

    // Add compability with different cfdi formats
    const root = jsonObj.length === 1 ? 0 : 1 

    const rootAt = jsonObj[root][':@'] // Extract the root attributes

    const fecha = rootAt['@_Fecha'].substring(0, 10)

    const comprobante = jsonObj[root]['cfdi:Comprobante']

    const descripcion = () => {
      const conceptos =
        comprobante[3]['cfdi:Conceptos'] ?? comprobante[2]['cfdi:Conceptos']
      let desc = []
      for (let i = 0; i < conceptos.length; i++) {
        let item = conceptos[i][':@']['@_Descripcion']
        desc.push(item)
      }
      // Create a new array without duplicate descriptions and join them into a string
      const descripciones = [...new Set(desc)]
      return descripciones.join(' - ')
    }

    const usos = {
      G01: 'ADQUISICIÓN DE MERCANCÍAS',
      G02: 'DEVOLUCIONES, DESCUENTOS O BONIFICACIONES',
      G03: 'GASTOS EN GENERAL',
      I01: 'CONSTRUCCIONES',
      I02: 'MOBILIARIO Y EQUIPO DE OFICINA POR INVERSIONES',
      I03: 'EQUIPO DE TRANSPORTE',
      I04: 'EQUIPO DE COMPUTO Y ACCESORIOS',
      I05: 'DADOS, TROQUELES, MOLDES, MATRICES Y HERRAMENTAL',
      I06: 'COMUNICACIONES TELEFÓNICAS',
      I07: 'COMUNICACIONES SATELITALES',
      I08: 'OTRA MAQUINARIA Y EQUIPO',
      D01: 'HONORARIOS MÉDICOS, DENTALES Y GASTOS HOSPITALARIOS',
      D02: 'GASTOS MÉDICOS POR INCAPACIDAD O DISCAPACIDAD',
      D03: 'GASTOS FUNERALES',
      D04: 'DONATIVOS',
      D05: 'INTERESES REALES EFECTIVAMENTE PAGADOS POR CRÉDITOS HIPOTECARIOS (CASA HABITACIÓN)',
      D06: 'APORTACIONES VOLUNTARIAS AL SAR',
      D07: 'PRIMAS POR SEGUROS DE GASTOS MÉDICOS',
      D08: 'GASTOS DE TRANSPORTACIÓN ESCOLAR OBLIGATORIA',
      D09: 'DEPÓSITOS EN CUENTAS PARA EL AHORRO, PRIMAS QUE TENGAN COMO BASE PLANES DE PENSIONES',
      D10: 'PAGOS POR SERVICIOS EDUCATIVOS (COLEGIATURAS)',
      P01: 'POR DEFINIR',
      S01: 'SIN EFECTOS FISCALES',
      CP01: 'PAGOS',
      CN01: 'NÓMINA'
    }

    const usoCFDI = () => {
      const clave =
        comprobante[2][':@']?.['@_UsoCFDI'] ??
        comprobante[1][':@']?.['@_UsoCFDI']

      return usos[clave] ?? ''
    }

    const formas = {
      '01': 'EFECTIVO',
      '02': 'CHEQUE NOMINATIVO',
      '03': 'TRANSFERENCIA ELECTRÓNICA DE FONDOS SPEI',
      '04': 'TARJETA DE CRÉDITO',
      '05': 'MONEDERO ELECTRÓNICO',
      '06': 'DINERO ELECTRÓNICO',
      '08': 'VALES DE DESPENSA',
      12: 'DACIÓN EN PAGO',
      13: 'PAGO POR SUBROGACIÓN',
      14: 'PAGO POR CONSIGNACIÓN',
      15: 'CONDONACIÓN',
      17: 'COMPENSACIÓN',
      23: 'NOVACIÓN',
      24: 'CONFUSIÓN',
      25: 'REMISIÓN DE DEUDA',
      26: 'PRESCRIPCIÓN O CADUCIDAD',
      27: 'A SATISFACCIÓN DEL ACREEDOR',
      28: 'TARJETA DE DÉBITO',
      29: 'TARJETA DE SERVICIOS',
      30: 'APLICACIÓN DE ANTICIPOS',
      31: 'INTERMEDIARIO PAGOS',
      99: 'POR DEFINIR'
    }

    const formaPago = () => {
      const pago =
        comprobante[3]['cfdi:Complemento']?.[0]['pago20:Pagos']?.[1][':@']?.[
          '@_FormaDePagoP'
        ] ?? rootAt['@_FormaPago']

      return formas[pago] ?? ''
    }

    const subTotal = rootAt['@_SubTotal']

    const descuento = rootAt['@_Descuento'] ?? '' // No descuento found

    const impuestos =
      comprobante.length >= 5
        ? (comprobante[4]['cfdi:Impuestos'] ?? comprobante[3]['cfdi:Impuestos'])
        : (comprobante[3]['cfdi:Complemento']?.[0]['pago20:Pagos']?.[1][
            'pago20:Pago'
          ]?.[1]['pago20:ImpuestosP'] ?? '') // No impuestos found

    const trasladadoRetenido = (taxName, taxtCode) => {
      let tax = 0
      Object.keys(impuestos).forEach((i) => {
        const nameC = impuestos[i][`cfdi:${taxName}`]
        const nameP = impuestos[i][`pago20:${taxName}P`]

        if (nameC) {
          Object.keys(nameC).forEach((e) => {
            if (nameC[e][':@']['@_Impuesto'] === taxtCode)
              tax = tax + Number(nameC[e][':@']['@_Importe'])
          })
        } else if (nameP) {
          Object.keys(nameP).forEach((e) => {
            if (nameP[e][':@']['@_ImpuestoP'] === taxtCode)
              tax = tax + Number(nameP[e][':@']['@_ImporteP'])
          })
        }
      })
      return tax > 0 ? tax : ''
    }

    const folioFactura = rootAt['@_Folio'] ?? '' // No folio found

    const folioFiscal = () => {
      const c3 = comprobante[3]?.['cfdi:Complemento']
      const c4 = comprobante[4]?.['cfdi:Complemento']
      const c5 = comprobante[5]?.['cfdi:Complemento']

      if (comprobante.length === 5) return c4[0][':@']['@_UUID']

      if (comprobante.length === 6)
        return c5[0][':@']['@_UUID'] ?? c4[0][':@']['@_UUID']

      return c3[':@']?.['@_UUID'] ?? c3[0][':@']?.['@_UUID']
    }

    // Extract the issuer name based on specific descriptions
    const emisor =
      descripcion().includes('PAGO POR SERVICIOS PROFESIONALES') ||
      descripcion().includes('PAGO POR PRESTACION DE SERVICIOS') ||
      descripcion().includes('PAGO POR LA PRESTACION DE SERVICIOS')
        ? comprobante[0][':@']['@_Nombre']
        : ''

    // Format the extracted data into a specific structure, separating fields with '@'
    data = `@${fecha}@@@@${descripcion()}@@${usoCFDI()}@${formaPago()}@${subTotal}@${descuento}@${trasladadoRetenido('Traslados', '002')}@${trasladadoRetenido('Retenciones', '002')}@${trasladadoRetenido('Retenciones', '001')}@${trasladadoRetenido('Traslados', '003')}@@${folioFactura}@${folioFiscal()}@${emisor}`
  },
  exportData(event) {
    if (event.target.matches('#download')) {
      try {
        extractor.convert()
      } catch (error) {
        if (error instanceof TypeError) {
          alert('El archivo XML no es compatible')
          console.log(error)
          return
        }
      }

      const blob = new Blob([data], {
        type: 'text/plain;charset=utf-8'
      })
      // Save as text document
      saveAs(blob, `${name}.txt`)

      document.querySelector('#download').classList.remove('is-visible')
      document.querySelector('#upload').value = null
    }
  },
  init() {
    document.addEventListener('change', extractor.importXML)
    document.addEventListener('click', extractor.exportData)
  }
}

export default extractor
