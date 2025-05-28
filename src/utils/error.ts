export function OnError(message = "Something went wrong", status = 400) {
	return function <T>(
		originalMethod: (this: T, ...args: any[]) => any,
		context: ClassMethodDecoratorContext<T>
	) {
		return async function (this: T, ...args: any[]) {
			try {
				return await originalMethod.apply(this, args);
			} catch (error: any) {
				return {message: `${message}: ${error?.message}`}
			}
		};
	};
}