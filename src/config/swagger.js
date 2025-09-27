const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API con Express y PostgreSQL",
      version: "1.0.0",
      description: "Documentación generada con OpenAPI/Swagger",
    },
    servers: [
      {
        url: "http://localhost:" + process.env.PORT,
      },
      {
        url: "http://172.31.3.30:" + process.env.PORT,
        description: "Servidor en red local",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = { swaggerUi, swaggerDocs };
