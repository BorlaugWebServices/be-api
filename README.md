# be-web

Rest API for borlaug block explorer `be-web`

### Configuration

Add `.env` file in project root folder

```
HOST=0.0.0.0
PORT=3000
DB_CONNECTION_TYPE=pg
DB_CONNECTION_URL=postgres://postgres:mysecretpassword@localhost:5432/borlaug
REDIS_HOSTS=127.0.0.1,127.0.0.1,127.0.0.1,127.0.0.1,127.0.0.1,127.0.0.1
REDIS_PORTS=7000,7001,7002,7003,7004,7005
HARVESTER=http://127.0.0.1:4000
CACHE_CLEANUP_SECRET=secret
```
