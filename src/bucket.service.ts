import { DB } from "./interface";
import {
	S3Client,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
	getSignedUrl
} from "@aws-sdk/s3-request-presigner";
import { file, insertFileSchema } from "@schema/file";

const supportedContentTypes = [
	'image/png',
	'image/jpeg',
	'image/webp',
	// 'image/gif',
	// 'application/pdf',
	// 'application/zip',
	// 'application/x-zip-compressed',
	// 'application/x-rar-compressed',
	// 'application/vnd.rar',
	// 'application/x-7z-compressed',
];

export class Upload extends DB {
	private client: S3Client;
	
	constructor(ctx: ExecutionContext, env: Env) {
		super(ctx, env);
		this.client = new S3Client({
			region: 'weur',
			endpoint: this.env.BUCKET_URL,
			credentials: {
				accessKeyId: this.env.BUCKET_ACCESS_KEY_ID,
				secretAccessKey: this.env.BUCKET_SECRET_ACCESS_KEY,
			},
			forcePathStyle: true
		});
	}

	async generateAlphanumericHash(seed: string, length = 18): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(seed);
		const hashBuffer = await crypto.subtle.digest("SHA-256", data);

		// Convert entire hash to base36 string
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hexString = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
		const base36 = BigInt('0x' + hexString).toString(36);

		// Return the first `length` characters
		return base36.slice(0, length);
	}

	async chatUploadLink(
		chatId: string,
		user: string,
		{size, type, name}: {
			size: number;
			type: string;
			name: string;
		}) {
		const format = name.split('.').pop();
		if (!format) {
			throw new Error('File name must have an extension');
		}
		const key = `${chatId}-${Date.now()}.${format}`;

		const values = insertFileSchema.parse({
			key,
			link: `${this.env.BUCKET_PUBLIC_DOMAIN}/${key}`,
			user,
			type,
			format,
		});
		const promise = this.db.insert(file).values(values);
		this.ctx.waitUntil(promise);
		return this.getSignedUrl(
			'blog-store',
			key,
			{
				// lenght: size,
				expiresInSeconds: 3600,
				contentType: type,
			}
		).then((url) => {
			return {
				url,
				file_link: `${this.env.BUCKET_PUBLIC_DOMAIN}/${key}`,
				contentType: type,
				key,
			};
		})
	}

	async getSignedUrl(
		bucketName: string, key: string, {
			// lenght,
			expiresInSeconds,
			contentType
		}: {
			// lenght: number;
			expiresInSeconds: number;
			contentType: string;

		}) {

		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: key,
			// ContentLength: 0,
			ContentType: contentType,

		});

		return getSignedUrl(this.client, command, {expiresIn: expiresInSeconds});
	}
}

