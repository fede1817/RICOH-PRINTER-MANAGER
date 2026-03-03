const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const net = require("net");
const { PDFDocument } = require("pdf-lib");

class PrinterService {
  async convertWordToPdf(inputPath, outputDir) {
    return new Promise((resolve, reject) => {
      const libreOfficePath = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`;
      const command = `${libreOfficePath} --headless --convert-to pdf "${inputPath}" --outdir "${outputDir}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Error en conversión:", stderr);
          return reject(error);
        }
        console.log("📄 Conversión salida:", stdout);

        const outputFile = path.join(
          outputDir,
          path.basename(inputPath, path.extname(inputPath)) + ".pdf",
        );
        resolve(outputFile);
      });
    });
  }

  async resizeToA4(filePath) {
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const a4Width = 595.28;
    const a4Height = 841.89;

    pdfDoc.getPages().forEach((page) => {
      page.setSize(a4Width, a4Height);
    });

    const a4PdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, a4PdfBytes);
    console.log("📄 PDF reescalado a A4");
  }

  async sendToPrinter(printerIp, filePath) {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      client.connect(9100, printerIp, () => {
        console.log(`📡 Conectado a impresora ${printerIp}`);
        const fileStream = fs.createReadStream(filePath);

        fileStream.on("data", (chunk) => client.write(chunk));
        fileStream.on("end", () => {
          console.log("✅ Archivo enviado a impresora");
          client.end();
          resolve();
        });
      });

      client.on("error", (err) => {
        reject(new Error("Error al imprimir: " + err.message));
      });
    });
  }

  cleanupFile(filePath) {
    fs.unlink(filePath, () => {});
  }
}

module.exports = new PrinterService();
