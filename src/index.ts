import * as ServerContract from '@riao/server-contract';
import { AuthenticationError, HttpError } from './errors';
import { ConnectionError } from './errors/connection-error';

export * from './errors';

export type DatabaseRecordId = number | string;
export type DatabaseRecord = Record<string, any>;

export interface RiaoHttpRequestOptions {
	withAccessToken?: boolean | string;
}

export interface RiaoRawHttpRequestOptions extends RiaoHttpRequestOptions {
	url?: string;
	path?: string;
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: any;
	query?: Record<string, any>;
}

export interface RiaoHttpRequest {
	request: RiaoRawHttpRequestOptions;
	fetchOptions: RequestInit;
	response?: Response;
}

export type RiaoCrudHttpRequest = RiaoHttpRequestOptions &
	Partial<RiaoRawHttpRequestOptions>;

export type GetManyRequest<T extends DatabaseRecord = DatabaseRecord> =
	ServerContract.GetManyRequest<T> & RiaoCrudHttpRequest;

export type GetOneRequest<T extends DatabaseRecord = DatabaseRecord> =
	ServerContract.GetOneRequest<T> & RiaoCrudHttpRequest;

export type SearchRequest<T extends DatabaseRecord = DatabaseRecord> =
	ServerContract.SearchRequest<T> & RiaoCrudHttpRequest;

export type PostOneRequest<T extends DatabaseRecord = DatabaseRecord> =
	ServerContract.PostOneRequest<T> & RiaoCrudHttpRequest;

export type PatchOneRequest<T extends DatabaseRecord = DatabaseRecord> =
	ServerContract.PatchOneRequest<T> & RiaoCrudHttpRequest;

export type DeleteOneRequest = ServerContract.DeleteOneRequest &
	RiaoCrudHttpRequest;

export type ActionRequest = ServerContract.PostRequest & RiaoCrudHttpRequest;

export class RiaoHttpClient<T extends DatabaseRecord = DatabaseRecord> {
	public url = '';
	public accessToken?: string;

	public async request(options: RiaoRawHttpRequestOptions): Promise<unknown> {
		let fullpath = options.url ?? this.url;

		const fetchOptions: RequestInit = {
			method: options.method,
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		};

		if (options.body) {
			fetchOptions.body = JSON.stringify(options.body);
		}

		if (options.path) {
			if (!fullpath.endsWith('/')) {
				fullpath += '/';
			}

			if (options.path.startsWith('/')) {
				options.path = options.path.replace('/', '');
			}

			fullpath += options.path;
		}

		if (options.query && Object.keys(options.query).length) {
			fullpath += this.serializeQuery(options.query);
		}

		if (options.withAccessToken) {
			let token = '';

			if (typeof options.withAccessToken === 'string') {
				token = options.withAccessToken;
			}
			else if (options.withAccessToken === true && this.accessToken) {
				token = this.accessToken;
			}

			if (!token.length) {
				throw new Error(
					'Request passed withAccessToken: true, but no access token exists'
				);
			}

			fetchOptions.headers = {
				...fetchOptions.headers,
				Authorization: 'Bearer  ' + token,
			};
		}

		let response: Response;

		try {
			response = await fetch(fullpath, fetchOptions);
		}
		catch (e) {
			throw new ConnectionError(e.message, {
				http: {
					request: options,
					fetchOptions,
					response,
				},
				userMessage:
					'Please check your internet connection and try again.',
			});
		}

		this.checkResponse({ request: options, fetchOptions, response });

		if (options.method === 'DELETE') {
			return response.body;
		}

		return response.json();
	}

	protected serializeQuery(params: Record<string, any>) {
		const qp = new URLSearchParams();

		for (const key in params) {
			qp.append(key, JSON.stringify(params[key]));
		}

		return '?' + qp;
	}

	public async getMany(
		request: GetManyRequest<T>
	): Promise<ServerContract.GetManyResponse<T>> {
		return <T[]>await this.request({
			method: 'GET',
			...request,
		});
	}

	public async getOne(
		request: GetOneRequest<T>
	): Promise<ServerContract.GetOneResponse> {
		return <T>await this.request({
			method: 'GET',
			path: '' + request.params.id,
			...request,
		});
	}

	public async search(
		request: ServerContract.SearchRequest<T>
	): Promise<ServerContract.SearchResponse<T>> {
		return <ServerContract.SearchResponse<T>>await this.request({
			method: 'POST',
			path: '/search',
			...request,
		});
	}

	public async postOne(
		request: PostOneRequest<T>
	): Promise<ServerContract.PostOneResponse<T>> {
		return <T>await this.request({
			method: 'POST',
			...request,
		});
	}

	public async patchOne(
		request: PatchOneRequest<T>
	): Promise<ServerContract.PatchOneResponse<T>> {
		return <T>await this.request({
			method: 'PATCH',
			path: '' + request.params.id,
			...request,
		});
	}

	public async deleteOne(
		request: DeleteOneRequest
	): Promise<ServerContract.DeleteOneResponse> {
		await this.request({
			method: 'DELETE',
			path: '' + request.params.id,
			...request,
		});
	}

	public async action(action: string, request: ActionRequest) {
		return await this.request({
			method: 'POST',
			path: 'action/' + action,
			...request,
		});
	}

	public checkResponse(http: RiaoHttpRequest) {
		if (http.response.status >= 400) {
			if (http.response.status === 401) {
				throw new AuthenticationError('Unauthenticated', {
					http,
					userMessage:
						'You\'re not signed in. Please sign-in and try again.',
				});
			}
			else {
				throw new HttpError('Request failed', {
					http,
					userMessage:
						'Oops! Something went wrong. Please refresh and try again.',
				});
			}
		}
	}
}
