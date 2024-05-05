import {
	DataQuery,
	DeleteOneResponse,
	GetManyResponse,
	GetOneResponse,
	PatchOneResponse,
	PostOneResponse,
} from '@riao/server-contract';

export type DatabaseRecordId = number | string;
export type DatabaseRecord = Record<string, any>;

interface RiaoHttpRequest {
	url: string;
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: any;
	query?: Record<string, any>;
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

		if (options.query && Object.keys(options.query).length) {
			options.url += this.serializeQuery(options.query);
		}

		const response = await fetch(options.url, fetchOptions);

		if (options.method === 'DELETE') {
			return response.body;
		}

		return response.json();
	}

	protected serializeQuery(params: Record<string, any>) {
		return '?' + new URLSearchParams(params);
	}

	public async getMany(query: DataQuery<T>): Promise<GetManyResponse<T>> {
		return <T[]>await this.request({
			method: 'GET',
			url: this.url,
			query,
		});
	}

	public async getOne(
		id: DatabaseRecordId,
		query?: DataQuery<T>
	): Promise<GetOneResponse> {
		return <T>await this.request({
			method: 'GET',
			url: `${this.url}/${id}`,
			query,
		});
	}

	public async postOne(record: Partial<T>): Promise<PostOneResponse<T>> {
		return <T>await this.request({
			method: 'POST',
			url: this.url,
			body: record,
		});
	}

	public async patchOne(
		id: DatabaseRecordId,
		data: Partial<T>
	): Promise<PatchOneResponse<T>> {
		return <T>await this.request({
			method: 'PATCH',
			url: `${this.url}/${id}`,
			body: data,
		});
	}

	public async deleteOne(id: DatabaseRecordId): Promise<DeleteOneResponse> {
		await this.request({
			method: 'DELETE',
			url: `${this.url}/${id}`,
		});
	}

	public async action(action: string, request: any | T) {
		return await this.request({
			method: 'POST',
			url: `${this.url}/${action}`,
			...request,
		});
	}
}
