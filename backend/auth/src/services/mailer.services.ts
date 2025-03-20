import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // Используем Gmail
  auth: {
    user: process.env.GMAIL_USER, // Твой email (пример: "youremail@gmail.com")
    pass: process.env.GMAIL_APP_PASSWORD, // Пароль приложения из Google
  },
});

/**
 * Отправляет email с 2FA-кодом
 * @param to Email получателя
 * @param subject Тема письма
 * @param html HTML-содержание письма
 */
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: `"Transcendence Auth" <${process.env.GMAIL_USER}>`, // Отправитель
      to, // Получатель
      subject, // Тема письма
      html, // HTML-содержимое
    });

    console.log(`📩 Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Email sending error:", error);
    throw new Error("Email sending failed");
  }
}
