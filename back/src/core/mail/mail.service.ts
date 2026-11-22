import { ISendMailOptions, MailerService } from "@nestjs-modules/mailer";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { env } from "../env";
import { WinstonLoggerService } from "../logging/logger.service";
import { LogBuilder } from "../logging/log-builder";
import { languageEnum } from "@flex/shared";
import { mailTexts, type MailTemplate } from "./mail.i18n";

@Injectable()
export class MailService {
	constructor(
		private readonly mailerService: MailerService,
		private readonly logger: WinstonLoggerService,
	) {}

	async sendEmail(
		emailsList: string[],
		template: MailTemplate,
		language: string | null | undefined,
		context: ISendMailOptions["context"],
	) {
		const lang = languageEnum.catch("en").parse(language);
		const t = mailTexts(template, lang);

		try {
			const sendMailParams: ISendMailOptions = {
				to: emailsList,
				subject: t.subject,
				template: template,
				context: { ...context, t, lang },
				headers: {
					"List-Unsubscribe": `<mailto:${env.SMTP_USER}?subject=unsubscribe>`,
					"List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
					"X-Mailer": "Flex",
					"X-Priority": "3",
					"X-MSMail-Priority": "Normal",
					"Content-Type": "text/html; charset=UTF-8",
				},
			};
			await this.mailerService.sendMail(sendMailParams);
			this.logger.log(LogBuilder.mail.send(emailsList, template));
		} catch (_e) {
			console.log(_e);
			this.logger.error(LogBuilder.error("SEND_EMAIL", "Failed to send the email"));
			throw new InternalServerErrorException("An error occurred while sending the email");
		}
	}
}
