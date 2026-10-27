ALTER TABLE "Complaint" ADD COLUMN "adminReadAt" TIMESTAMP(3);

-- Existing linked complaints also follow the shared issue's current state.
UPDATE "Complaint" AS c
SET "status" = i."status"::text::"ComplaintStatus", "updatedAt" = CURRENT_TIMESTAMP
FROM "IncidentComplaint" AS link
JOIN "Incident" AS i ON i.id = link."incidentId"
WHERE c.id = link."complaintId" AND c."status"::text <> i."status"::text;
