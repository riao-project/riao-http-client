import * as ServerContract from '@riao/server-contract';

export type DatabaseRecordId = number | string;
export type DatabaseRecord = Record<string, any>;

export interface RiaoHttpRequest {}

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
	public auth = '';

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
			fullpath += options.path;
		}

		if (options.query && Object.keys(options.query).length) {
			fullpath += this.serializeQuery(options.query);
		}

		const response = await fetch(fullpath, fetchOptions);

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
			path: <string>request.params.id,
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
			path: <string>request.params.id,
			...request,
		});
	}

	public async deleteOne(
		request: DeleteOneRequest
	): Promise<ServerContract.DeleteOneResponse> {
		await this.request({
			method: 'DELETE',
			path: <string>request.params.id,
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
