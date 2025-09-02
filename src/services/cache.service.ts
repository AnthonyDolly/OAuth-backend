import redis from '../config/redis';

export async function setJson(key: string, value: any, ttlSeconds?: number) {
	const text = JSON.stringify(value);
	if (ttlSeconds && ttlSeconds > 0) {
		await redis.set(key, text, 'EX', ttlSeconds);
	} else {
		await redis.set(key, text);
	}
}

export async function getJson<T = any>(key: string): Promise<T | null> {
	const text = await redis.get(key);
	return text ? (JSON.parse(text) as T) : null;
}

export async function del(key: string) {
	await redis.del(key);
}

export default { setJson, getJson, del };


