import xss from 'xss';

function sanitizeValue(value: any): any {
	if (typeof value === 'string') return xss(value);
	if (Array.isArray(value)) return value.map(sanitizeValue);
	if (value && typeof value === 'object') {
		const out: any = {};
		for (const [k, v] of Object.entries(value)) out[k] = sanitizeValue(v);
		return out;
	}
	return value;
}

export function sanitizeBody(req: any, _res: any, next: any) {
	if (req.body) req.body = sanitizeValue(req.body);
	return next();
}

