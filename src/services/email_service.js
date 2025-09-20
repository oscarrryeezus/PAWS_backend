const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

class EmailService {
  constructor() {
    // Configurar transporter para Gmail (puedes cambiarlo por tu proveedor)
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  /**
   * Envía un código de verificación de 6 dígitos por correo
   * @param {string} correo - Email del usuario
   * @param {string} nombre - Nombre del usuario
   * @param {string} codigo - Código de 6 dígitos
   * @returns {Promise<boolean>} - True si se envió correctamente
   */
  async enviarCodigoVerificacion(correo, nombre, codigo) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: correo,
        subject: "Código de verificación - PAWS",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">¡Hola ${nombre}!</h2>
            <p>Tu código de verificación para completar el registro en PAWS es:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background-color: #f0f0f0; padding: 20px 30px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">
                ${codigo}
              </div>
            </div>
            
            <p><strong>Este código expirará en 15 minutos.</strong></p>
            <p>Una vez que verifiques tu correo, podrás configurar tu autenticación de dos factores (2FA).</p>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>Importante:</strong> No compartas este código con nadie. Nuestro equipo nunca te pedirá este código por teléfono o email.
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Si no solicitaste este registro, puedes ignorar este correo.
            </p>
            <hr>
            <p style="color: #999; font-size: 12px;">PAWS - Sistema de autenticación</p>
          </div>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      return result.accepted.length > 0;
    } catch (error) {
      console.error("Error al enviar correo:", error);
      throw new Error(
        `Error al enviar código de verificación: ${error.message}`
      );
    }
  }

  /**
   * Verifica la configuración del servicio de email
   * @returns {Promise<boolean>} - True si la configuración es válida
   */
  async verificarConfiguracion() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("Error en configuración de email:", error);
      return false;
    }
  }
}

module.exports = EmailService;
