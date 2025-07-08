import { defineConfig } from 'drizzle-kit';

const schema = ['chat', 'user', 'file']
  .map(name => `./src/schema/${name}.ts`);

export default defineConfig({
  schema,
  out: './database',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
});