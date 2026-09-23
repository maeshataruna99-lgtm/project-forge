declare module 'nodemailer' {
  interface TransportOptions {
    host: string;
    port: number;
    secure: boolean;
    auth?: { user: string; pass?: string };
  }

  interface MailMessage {
    from: string;
    to: string;
    subject: string;
    text: string;
  }

  const nodemailer: {
    createTransport(options: TransportOptions): {
      sendMail(message: MailMessage): Promise<unknown>;
    };
  };

  export default nodemailer;
}
