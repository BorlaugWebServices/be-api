# be-web

Rest API for borlaug block explorer `be-web`

### Configuration

Add `env.json` file in config folder

```
{
    "host": "0.0.0.0",
    "port": 3000,
    "db": {
        "type": "pg",
        "url": "postgres://postgres:mysecretpassword@localhost:5432/borlaug"
    },
    "redisCluster": [
        {
            "host": "127.0.0.1",
            "port": "7000"
        },
        {
            "host": "127.0.0.1",
            "port": "7001"
        },
        {
            "host": "127.0.0.1",
            "port": "7002"
        },
        {
            "host": "127.0.0.1",
            "port": "7003"
        },
        {
            "host": "127.0.0.1",
            "port": "7004"
        },
        {
            "host": "127.0.0.1",
            "port": "7005"
        }
    ],
    "harvester": "http://127.0.0.1:4000",
    "cacheCleanupSecret": "61a3ef4d-20ec-4057-8f4e-a2dd526ad9b9"
}
```
