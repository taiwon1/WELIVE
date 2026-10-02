import swaggerUi from "swagger-ui-express";
import type { Express } from "express";
import { apartmentDocs } from "./apartment.docs";
import { pollDocs } from "./poll.docs";
import { authDocs } from "./auth.docs";
import { userDocs } from "./user.docs";
import { residentDocs } from "./resident.docs";

import { incidentDocs } from "./incident.docs";

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "위리브 API",
    version: "1.0.0",
    description: "위리브 API 명세서",
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  paths: {
    ...apartmentDocs,
    ...pollDocs,
    ...authDocs,
    ...userDocs,
    ...residentDocs,
    ...incidentDocs,
  },
};

export const setupSwagger = (app: Express): void => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log("Swagger 문서: http://localhost:4000/api-docs");
};
