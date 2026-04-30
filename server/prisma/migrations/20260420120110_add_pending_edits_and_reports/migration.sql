-- CreateTable
CREATE TABLE "PendingProfileEdit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coachProfileId" TEXT NOT NULL,
    "changes" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PendingProfileEdit_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coachProfileId" TEXT NOT NULL,
    "reporterUserId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "adminNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileReport_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
