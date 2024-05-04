import {
	ApiRequest,
	DeleteOneRequest,
	DeleteOneResponse,
	GetManyRequest,
	GetManyResponse,
	GetOneRequest,
	GetOneResponse,
	PatchOneRequest,
	PatchOneResponse,
	PostOneRequest,
	PostOneResponse,
} from '@riao/server-contract';

export type DatabaseRecord = Record<string, any>;

interface RiaoHttpRequest {
	url: string;
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: any;
	queryParams?: Record<string, any>;
}

export class RiaoHttpClient<T extends DatabaseRecord = DatabaseRecord> {
	public url = '';

	public async request(options: RiaoHttpRequest): Promise<unknown> {
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

		if (options.queryParams && Object.keys(options.queryParams).length) {
			options.url += this.queryParams(options.queryParams);
		}

		const response = await fetch(options.url, fetchOptions);

		if (options.method === 'DELETE') {
			return response.body;
		}

		return response.json();
	}

	protected queryParams(params: Record<string, any>) {
		return '?' + new URLSearchParams(params);
	}

	public async getMany(
		request: GetManyRequest<T>
	): Promise<GetManyResponse<T>> {
		return <T[]>await this.request({
			method: 'GET',
			url: this.url,
			queryParams: request,
		});
	}

	public async getOne(request: GetOneRequest): Promise<GetOneResponse> {
		return <T>await this.request({
			method: 'GET',
			url: `${this.url}/${request.id}`,
		});
	}

	public async postOne(
		request: PostOneRequest<T>
	): Promise<PostOneResponse<T>> {
		return <T>await this.request({
			method: 'POST',
			url: this.url,
			body: request,
		});
	}

	public async patchOne(
		request: PatchOneRequest<T>
	): Promise<PatchOneResponse<T>> {
		return <T>await this.request({
			method: 'PATCH',
			url: `${this.url}/${request.id}`,
			body: request.data,
		});
	}

	public async deleteOne(
		request: DeleteOneRequest
	): Promise<DeleteOneResponse> {
		await this.request({
			method: 'DELETE',
			url: `${this.url}/${request.id}`,
		});
	}

	public async action(action: string, request: any | T) {
		return await this.request({
			method: 'POST',
			url: `${this.url}/${action}`,
			body: request,
		});
	}
}
