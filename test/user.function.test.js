require("dotenv").config();
const request = require("supertest");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");
let agent;
let saveRes;
const { app, server } = require("../app");

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
  agent = request.agent(app);
});

afterAll(async () => {
  prisma.$disconnect();
  server.close();
});

describe("register a user ", () => {
    let saveRes = null;
    let csrfToken = null;
  
    it("46. it creates the user entry", async () => {
        const newUser = {
            name: "Captain Marvel",
            email: "cptmarvel@example.com",
            password: "Pa$$word20",
        };
      saveRes = await agent.post("/api/users/register").send(newUser);
      expect(saveRes.status).toBe(201);
    });
  
    it("47. registration returns an object with the expected name.", () => {
      expect(saveRes.body.user.name).toBe("Captain Marvel");
    });
  
    it("48. test that the returned object includes a csrfToken.", () => {
      expect(saveRes.body.csrfToken).toBeDefined();
    });
  
    it("49. you can logon as the newly registered user.", async () => {
      const creds = {
        email: "cptmarvel@example.com",
        password: "Pa$$word20",
      };
      const res = await agent.post("/api/users/logon").send(creds);
      csrfToken = res.body.csrfToken; // the token that matches the JWT cookie
      expect(res.status).toBe(200);
    });
  
    it("50. Verify that you are logged in: /api/tasks should not return a 401", async () => {
        const res = await agent.get("/api/tasks");
        expect(res.status).not.toBe(401);
      });
      
      it("51. Verify that you can log out.", async () => {
        const res = await agent
          .post("/api/users/logoff")
          .set("X-CSRF-TOKEN", csrfToken);
      
        expect([200, 204]).toContain(res.status);
      });
      
      it("52. Make sure that you are really logged out: /api/tasks should return a 401", async () => {
        const res = await agent.get("/api/tasks");
        expect(res.status).toBe(401);
      });
  });