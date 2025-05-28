# D1_API

commands to manage D1 database
```sh
# generate migrations file
sudo npx drizzle-kit generate

# execute sql scripts
name="fewef"
sudo npx wrangler d1 execute MAIN --local --file="drizzle/migrations/${name}.sql"
```
