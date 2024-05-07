/* eslint-disable no-console */

import { RiaoHttpClient } from '../src';

export class User {
	id?: number;
	username: string;
	password: string;
}

const user: User = {
	username: 'apitest',
	password: 'password123',
};

class UserHttpClient extends RiaoHttpClient<User> {
	url = 'http://localhost:3000/api/v1/users';
}

const userRepo = new UserHttpClient();

/**
 * Do something!
 */
export default async function example(): Promise<void> {
	console.log('Hello!');

	// Create a single user
	const newUser = await userRepo.postOne({ body: user });
	console.log('Created user', newUser);

	// Get all users
	const users = await userRepo.getMany({ query: { limit: 3 } });
	console.log('Got all users', users);

	// Get one user
	if (newUser.id) {
		const getNewUser = await userRepo.getOne({
			params: { id: newUser.id },
		});
		console.log('Get new user', getNewUser);
	}
	else {
		console.log('No new user to get');
	}

	// Login
	if (newUser.id) {
		await userRepo.action('login', {
			body: {
				username: 'bob',
				password: 'password123',
			},
		});
	}

	// Patch one user
	if (newUser.id) {
		const patchedUser = await userRepo.patchOne({
			params: { id: newUser.id },
			body: { username: 'patched' },
		});
		console.log('Patched new user', patchedUser);
	}
	else {
		console.log('No new user to patch');
	}

	// Delete one user
	if (newUser.id) {
		await userRepo.deleteOne({
			params: { id: newUser.id },
		});
		console.log('Deleted the user!');
	}
	else {
		console.log('No new user to patch');
	}
}
