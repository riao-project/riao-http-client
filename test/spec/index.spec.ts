import 'jasmine';
import { RiaoHttpClient } from '../../src';

class TestClient extends RiaoHttpClient {
	url = 'http://localhost:3000/api/v1/users/';
}

describe('Client', () => {
	const userRepo = new TestClient();

	beforeAll(() => {
		console.warn('Before running tests, you must:');
		console.warn('	- Setup riao-server');
		console.warn('	- Run unit tests in riao-server to seed data');
		console.warn(
			'	- Run riao-server\'s example server while this test suite runs'
		);
	});

	it('can get many', async () => {
		expect(await userRepo.getMany({ query: { limit: 5 } })).toEqual([
			{ id: 1, username: 'test1', password: 'password1234' },
			{ id: 2, username: 'test2', password: 'password1234' },
			{ id: 3, username: 'test3', password: 'password1234' },
			{ id: 4, username: 'test4', password: 'password1234' },
			{ id: 5, username: 'test5', password: 'password1234' },
		]);
	});

	it('can get one', async () => {
		expect(await userRepo.getOne({ params: { id: 1 } })).toEqual({
			id: 1,
			username: 'test1',
			password: 'password1234',
		});
	});

	it('can post one', async () => {
		const user = await userRepo.postOne({
			body: {
				username: 'tom@test.com',
				password: 'password1234',
			},
		});
		expect(user.id).toBeGreaterThanOrEqual(5);
		expect(user.username).toEqual('tom@test.com');
		expect(user.password).toEqual('password1234');
	});

	it('can patch one', async () => {
		expect(
			await userRepo.patchOne({
				params: { id: 7 },
				body: {
					username: 'tomupdated@test.com',
				},
			})
		).toEqual(<any>{
			id: 7,
			username: 'tomupdated@test.com',
			password: 'password1234',
		});
	});

	it('can delete one', async () => {
		expect(await userRepo.deleteOne({ params: { id: 8 } })).toEqual(
			undefined
		);
	});

	it('can login', async () => {
		expect(
			await userRepo.action('login', {
				body: {
					username: 'login-user',
					password: 'password1234',
				},
			})
		).toEqual({});
	});
});
