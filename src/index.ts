import * as ServerContract from '@riao/server-contract';

export type DatabaseRecordId = number | string;
export type DatabaseRecord = Record<string, any>;

export interface RiaoHttpRequest {
	withAccessToken?: boolean | string;
}

export interface RiaoRawHttpRequest extends RiaoHttpRequest {
	url?: string;
	path?: string;
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: any;
	query?: Record<string, any>;
}

export type RiaoCrudHttpRequest = RiaoHttpRequest & Partial<RiaoRawHttpRequest>;

export type GetManyRequest<T extends DatabaseRecord = DatabaseRecord> =
	ServerContract.GetManyRequest<T> & RiaoCrudHttpRequest;

export type GetOneRequest<T extends DatabaseRecord = DatabaseRecord> =
	ServerContract.GetOneRequest<T> & RiaoCrudHttpRequest;

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

	public async request(options: RiaoRawHttpRequest): Promise<unknown> {
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
			let token: string;

			if (typeof options.withAccessToken === 'string') {
				token = options.withAccessToken;
			}
			else if (options.withAccessToken === true) {
				if (!this.accessToken) {
					throw new Error(
						'Request passed withAccessToken: true, but no access token exists'
					);
				}

				token = this.accessToken;
			}

			fetchOptions.headers['Authorization'] = 'Bearer ' + token;
		}

		const response = await fetch(fullpath, fetchOptions);

		// TODO: Error handling
		if (response.status >= 400) {
			throw new Error(
				'Request failed: ' +
					JSON.stringify({
						request: options,
						fetchOptions: fetchOptions,
						response: {
							status: response.status,
							statusText: response.statusText,
							body: response.body,
						},
					})
			);
		}

		if (options.method === 'DELETE') {
			return response.body;
		}

		return response.json();
	}

	protected serializeQuery(params: Record<string, any>) {
		return '?' + new URLSearchParams(params);
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
			path: action,
			...request,
		});
	}
}
