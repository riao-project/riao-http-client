import { RiaoHttpRequest, RiaoRawHttpRequestOptions } from 'src';

export interface HttpErrorOptions {
	http: RiaoHttpRequest;
	userMessage?: string;
}

export class HttpError extends Error implements HttpErrorOptions {
	http: RiaoHttpRequest;
	userMessage: string;

	constructor(message: string, options: HttpErrorOptions) {
		super(message);
		this.message = message;
		this.http = options.http;
		this.userMessage = options.userMessage;
	}
}
