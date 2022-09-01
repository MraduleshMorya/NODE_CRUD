const request = require("supertest")
let server_obj;

describe("api",()=>{

    beforeEach( async () => {
      server_obj = await require("../../index");
    });
    afterEach(async () => {
      await server_obj.close();
    });

    describe("endpoint",()=>{
        // test case 1 
        it("get user with right token:-", async () => {
            const response = await request(server_obj)
              .get("/getdata")
              .send({
                x_auth_token:
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJzdF9uYW1lIjoieWFzaCIsImxhc3RfbmFtZSI6IiIsImlhdCI6MTY2MTk1MzcyN30.q8yrGV4-WGSqse21BCpPPwO61l6rRRzHPR-QOU-5Qzg",
              })
              .set({
                x_auth_token:
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJzdF9uYW1lIjoieWFzaCIsImxhc3RfbmFtZSI6IiIsImlhdCI6MTY2MTk1MzcyN30.q8yrGV4-WGSqse21BCpPPwO61l6rRRzHPR-QOU-5Qzg",
              });

            expect(response.status)
              .toBe(200)
            // console.log(response.body);
              
        });
        // test case 2 
        it("get user with wrong  token:-", async () => {
          const response = await request(server_obj)
            .get("/getdata")
            .send({
              x_auth_token:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJzdF9uYW1lIjoieWFzaCIsImxhc3RfbmFtZSI6IiIsImlhdCI6MTY2MTk1MzcyN30.q8yrGV4-WGSqse21BCpPPwO61l6rRRzHPR-QOU-5Qzgdfgh",
            })
            .set({
              x_auth_token:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJzdF9uYW1lIjoieWFzaCIsImxhc3RfbmFtZSI6IiIsImlhdCI6MTY2MTk1MzcyN30.q8yrGV4-WGSqse21BCpPPwO61l6rRRzHPR-QOU-5Qzgfgh",
            });

          expect(response.status).toBe(400);
        });

        //test 3 
        it("get user with username:-", async () => {
          const response = await request(server_obj)
            .get("/getdata?username=ymorya")
            .send({
              x_auth_token:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJzdF9uYW1lIjoieWFzaCIsImxhc3RfbmFtZSI6IiIsImlhdCI6MTY2MTk1MzcyN30.q8yrGV4-WGSqse21BCpPPwO61l6rRRzHPR-QOU-5Qzg",
            })
            .set({
              x_auth_token:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJzdF9uYW1lIjoieWFzaCIsImxhc3RfbmFtZSI6IiIsImlhdCI6MTY2MTk1MzcyN30.q8yrGV4-WGSqse21BCpPPwO61l6rRRzHPR-QOU-5Qzg",
            });

          expect(response.status).toBe(200);
          console.log(response.body.data[0]);
          const temp = response
          expect(response.body.data[0]).toEqual({
                id: 1,
                fname: "yash",
                lname: "morya",
                username: "ymorya",
                password: "9274",
              });
        });
    });

    it("test case :-", () => {});
    
});
