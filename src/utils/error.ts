export function OnError(message = "Something went wrong", log = false, status = 400) {
	return function <T>(
		originalMethod: (this: T, ...args: any[]) => any,
		context: ClassMethodDecoratorContext<T>
	) {
		return async function (this: T, ...args: any[]) {
			try {
				return await originalMethod.apply(this, args);
			} catch (error: any) {
				const define = {message: `${message}: ${error?.message}`}
				log && console.error(define);
				return JSON.stringify(define);
			}
		};
	};
}