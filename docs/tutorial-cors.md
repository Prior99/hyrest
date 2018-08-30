---
id: tutorial-cors
title: 10. Cors
---

In order to make the backend reachable for a frontend on another domain, we need to add cors support.

Put the following lines somwhere into the initialize function in your `src/server/server.ts`:

```typescript
this.app.use((req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
    }
    return next();
});
```
