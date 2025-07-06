# D1_API

commands to manage D1 database
```sh
# generate migrations file
npx drizzle-kit generate

# execute sql scripts
sql="fewef"
npx wrangler d1 execute MAIN --local --file="${DRIZZLE_OUT}/${sql}.sql"
```
