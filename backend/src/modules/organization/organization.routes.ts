import { Router } from "express";
import { validate } from "../../middleware/validation.middleware";
import { CreateOrganizationSchema,organizationIdSchema } from "./organization.schema";
import { createOrganization,listOrganization,getOrganization,updateOrganization,deleteOrganization } from "./organization.controller";

const organizationRouter = Router()

organizationRouter.post("/",validate(CreateOrganizationSchema),createOrganization)
organizationRouter.get("/",listOrganization)
organizationRouter.get("/:id",validate(organizationIdSchema),getOrganization)
organizationRouter.patch("/:id",validate(organizationIdSchema),validate(CreateOrganizationSchema),updateOrganization)
organizationRouter.delete("/:id",validate(organizationIdSchema),deleteOrganization)


export {organizationRouter}