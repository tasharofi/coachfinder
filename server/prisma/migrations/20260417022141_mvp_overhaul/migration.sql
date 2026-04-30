-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "googleId" TEXT,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "slug" TEXT NOT NULL,
    "isLearner" BOOLEAN NOT NULL DEFAULT true,
    "isCoach" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CoachProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "headline" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "hourlyRate" REAL NOT NULL DEFAULT 0,
    "sessionMode" TEXT NOT NULL DEFAULT 'BOTH',
    "suburb" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "postcode" TEXT NOT NULL DEFAULT '',
    "lat" REAL,
    "lng" REAL,
    "serviceRadius" TEXT NOT NULL DEFAULT '',
    "yearsExp" INTEGER NOT NULL DEFAULT 0,
    "certifications" TEXT NOT NULL DEFAULT '',
    "linkedinUrl" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "availability" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CoachProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "CoachSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coachProfileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    CONSTRAINT "CoachSkill_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoachSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coachProfileId" TEXT NOT NULL,
    "learnerUserId" TEXT,
    "learnerName" TEXT NOT NULL,
    "learnerEmail" TEXT NOT NULL,
    "learnerPhone" TEXT,
    "preferredMode" TEXT NOT NULL DEFAULT 'EITHER',
    "preferredDays" TEXT NOT NULL DEFAULT '[]',
    "preferredTimes" TEXT NOT NULL DEFAULT '[]',
    "message" TEXT NOT NULL DEFAULT '',
    "preferredSuburb" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContactRequest_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CoachProfile_userId_key" ON "CoachProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CoachSkill_coachProfileId_skillId_key" ON "CoachSkill"("coachProfileId", "skillId");
