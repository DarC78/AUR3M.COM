import sql from "mssql";
import { getDbPool } from "./db";

type EnqueueEmailInput = {
  emailType: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  htmlBody: string;
  toSendAfterDate?: Date;
};

export async function enqueueEmail(input: EnqueueEmailInput): Promise<void> {
  const pool = await getDbPool();

  await pool.request()
    .input("email_type", sql.NVarChar(50), input.emailType)
    .input("from_email", sql.NVarChar(255), input.fromEmail)
    .input("to_email", sql.NVarChar(255), input.toEmail)
    .input("subject", sql.NVarChar(255), input.subject)
    .input("html_body", sql.NVarChar(sql.MAX), input.htmlBody)
    .input("to_send_after_date", sql.DateTime2, input.toSendAfterDate ?? new Date())
    .query(`
      INSERT INTO dbo.scheduled_emails (
        email_type,
        from_email,
        to_email,
        subject,
        html_body,
        to_send_after_date
      )
      VALUES (
        @email_type,
        @from_email,
        @to_email,
        @subject,
        @html_body,
        @to_send_after_date
      );
    `);
}
